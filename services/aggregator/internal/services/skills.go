package services

import (
	"context"
	"os"
	"strings"
	"time"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scorer"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/utils"
	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
)

type SkillsService struct {
	embedder    *scorer.Embedder
	store       *storage.Store
	skillsFile  string
	MaxAttempts int
}

type skillFile struct {
	Skills []string `yaml:"skills"`
}

func NewSkillsService(store *storage.Store, embedder *scorer.Embedder, skillsFile string) *SkillsService {
	return &SkillsService{
		embedder:    embedder,
		store:       store,
		skillsFile:  skillsFile,
		MaxAttempts: 5, // Set a default value for MaxAttempts
	}
}

func (s *SkillsService) LoadSkillVector(ctx context.Context) ([]float32, error) {
	logger.Info("Loading skills from file", zap.String("file", s.skillsFile))

	buf, err := os.ReadFile(s.skillsFile)
	if err != nil {
		logger.Error("Error reading skills file", zap.Error(err), zap.String("file", s.skillsFile))
		return nil, err
	}

	var sf skillFile
	if err := yaml.Unmarshal(buf, &sf); err != nil {
		logger.Error("Error parsing skills YAML", zap.Error(err))
		return nil, err
	}

	logger.Info("Loaded skills",
		zap.Int("count", len(sf.Skills)),
		zap.Strings("skills", sf.Skills))

	skillsText := strings.Join(sf.Skills, " ")

	logger.Info("Generating embeddings for skills")
	emb, err := s.embedder.Embed(ctx, skillsText)
	if err != nil {
		logger.Error("Error generating embeddings", zap.Error(err))
		return nil, err
	}

	logger.Info("Generated embeddings vector", zap.Int("dimensions", len(emb)))
	return emb, nil
}

type Summary struct {
	Processed, Succeeded, Failed, Requeued int
	NextDueMs                              int64
}

// services/aggregator/internal/skills/worker.go
func (s *SkillsService) ProcessPendingEmbeds(ctx context.Context, limit int) (*Summary, error) {
	sum := &Summary{}

	jobs, err := s.store.FetchPendingUserSkillEmbeds(ctx, limit)
	if err != nil {
		return sum, err
	}

	for _, j := range jobs {
		err := s.store.UpdateUserSkillEmbedJobStatus(ctx, j.UserID, storage.StatusProcessing)
		if err != nil {
			return sum, err
		}
	}

	sum.Processed = len(jobs)

	// 2) process each job — Embedder handles warmups/retries internally
	for _, j := range jobs {
		// give each item its own budget; Embed() also manages its own timeout
		itemCtx := context.Background()
		vec32, err := s.embedder.Embed(itemCtx, strings.Join([]string{j.Skills}, " "))

		if err == nil {
			// write vector with correct cast (float4 if your column is vector(384))
			wErr := s.store.UpdateUsersSkillVector(ctx, j.UserID, vec32)
			if wErr == nil {
				if err := s.store.DeleteSucceededUserSkillEmbedJobs(ctx, j.UserID); err != nil {
					logger.Error("Failed to delete succeeded user skill embed jobs", zap.Error(err), zap.String("userID", j.UserID))
				}
				sum.Succeeded++
				continue
			}
			err = wErr
		}

		// backoff/fail
		next := j.Attempts + 1
		status := storage.StatusPending
		if next >= s.MaxAttempts {
			status = storage.StatusFailed
			sum.Failed++
		} else {
			sum.Requeued++
		}
		delay := time.Duration(min(next*30, 10*60)) * time.Second

		if updateErr := s.store.UpdateUserSkillEmbedJobStatusWithError(ctx, j.UserID, status, utils.TruncateErr(err), next, delay.String()); updateErr != nil {
			logger.Error("Failed to update user skill embed job status with error", zap.Error(updateErr), zap.String("userID", j.UserID))
		}
	}

	return sum, nil
}
