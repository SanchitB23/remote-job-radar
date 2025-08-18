package storage

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/logger"
	"github.com/sanchitb23/remote-job-radar/aggregator/internal/utils"

	"github.com/lib/pq"
	"go.uber.org/zap"
)

type Store struct{ DB *sql.DB }

func New(dsn string) (*Store, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	return &Store{DB: db}, db.Ping()
}

func (s *Store) UpsertJobs(ctx context.Context, rows []JobRow) error {
	if len(rows) == 0 {
		return nil
	}

	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	stmt := `INSERT INTO jobs
	(id,source,title,company,description,location,work_type,salary_min,salary_max,url,published_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
	ON CONFLICT (id) DO NOTHING`

	var insertedJobs []string
	batchSize := 100 // Process in smaller batches to avoid overwhelming the database

	for i := 0; i < len(rows); i += batchSize {
		end := i + batchSize
		if end > len(rows) {
			end = len(rows)
		}

		batch := rows[i:end]
		logger.Info("Processing job batch",
			zap.Int("batchStart", i+1),
			zap.Int("batchEnd", end),
			zap.Int("totalJobs", len(rows)))

		for _, r := range batch {
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
			}

			// Sanitize description: convert HTML to text if needed
			description, _ := utils.PreprocessText(r.Description, 0)

			result, err := tx.ExecContext(ctx, stmt,
				r.ID, r.Source, r.Title, r.Company, description, r.Location, r.WorkType,
				r.SalaryMin, r.SalaryMax, r.URL, r.PublishedAt)
			if err != nil {
				logger.Error("Insert error: " + err.Error())
				return err
			}

			// Check if this was actually inserted (not a conflict)
			if rowsAffected, _ := result.RowsAffected(); rowsAffected > 0 {
				insertedJobs = append(insertedJobs, r.ID)
			}
		}
	}

	// Send notifications for newly inserted jobs only
	for _, jobID := range insertedJobs {
		if _, err := tx.ExecContext(ctx, `SELECT pg_notify('new_job', $1)`, jobID); err != nil {
			logger.Error("NOTIFY error: " + err.Error())
		}
	}

	logger.Info("Successfully processed all job batches",
		zap.Int("totalProcessed", len(rows)),
		zap.Int("newJobs", len(insertedJobs)))

	return tx.Commit()
}

func (s *Store) FetchRowsNeedingVector(ctx context.Context) ([]JobRow, error) {
	stmt := `SELECT id, source, title, company, description, location, work_type, salary_min, salary_max, url, published_at
		FROM jobs 
		WHERE vector IS NULL`

	rows, err := s.DB.QueryContext(ctx, stmt)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []JobRow
	for rows.Next() {
		var row JobRow
		err := rows.Scan(
			&row.ID, &row.Source, &row.Title, &row.Company, &row.Description,
			&row.Location, &row.WorkType, &row.SalaryMin, &row.SalaryMax, &row.URL, &row.PublishedAt,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, row)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

func (s *Store) UpdateVectorAndFit(ctx context.Context, id string, vector []float32, fitScore float32) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// Convert float32 slice to pgvector format: '[1.1,2.2,3.3]'
	vectorStr := vectorToString(vector)

	stmt := `UPDATE jobs SET vector = $1::vector, fit_score = $2 WHERE id = $3`
	_, err = tx.ExecContext(ctx, stmt, vectorStr, fitScore, id)
	if err != nil {
		return err
	}

	// Send notification after fitScore is calculated
	if _, err := tx.ExecContext(ctx, `SELECT pg_notify('job_scored', $1)`, id); err != nil {
		logger.Error("NOTIFY job_scored error: " + err.Error())
	}

	return tx.Commit()
}

// vectorToString converts []float32 to pgvector format: '[1.1,2.2,3.3]'
func vectorToString(vector []float32) string {
	if len(vector) == 0 {
		return "[]"
	}

	var parts []string
	for _, v := range vector {
		parts = append(parts, fmt.Sprintf("%g", v))
	}
	return "[" + strings.Join(parts, ",") + "]"
}

// Ping checks the database connection
func (s *Store) Ping(ctx context.Context) error {
	return s.DB.PingContext(ctx)
}

type JobRow struct {
	ID, Source, Title, Company, Description, Location, WorkType, URL string
	SalaryMin, SalaryMax                                             int
	PublishedAt                                                      string // ISO-8601
	Vector                                                           pq.Float32Array
	FitScore                                                         *float32
}
