package services

import (
	"context"
	"os"
	"strings"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/scorer"
	"go.uber.org/zap"
	"gopkg.in/yaml.v3"
)

type SkillsService struct {
	embedder   *scorer.Embedder
	skillsFile string
}

type skillFile struct {
	Skills []string `yaml:"skills"`
}

func NewSkillsService(embedder *scorer.Embedder, skillsFile string) *SkillsService {
	return &SkillsService{
		embedder:   embedder,
		skillsFile: skillsFile,
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
