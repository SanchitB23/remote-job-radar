package storage

import (
	"context"
	"database/sql"

	"github.com/lib/pq"
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
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	stmt := `INSERT INTO jobs
	(id,source,title,company,description,location,salary_min,salary_max,url,published_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
	ON CONFLICT (id) DO NOTHING`
	for _, r := range rows {
		if _, err = tx.ExecContext(ctx, stmt,
			r.ID, r.Source, r.Title, r.Company, r.Description, r.Location,
			r.SalaryMin, r.SalaryMax, r.URL, r.PublishedAt); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (s *Store) FetchRowsNeedingVector(ctx context.Context) ([]JobRow, error) {
	stmt := `SELECT id, source, title, company, description, location, salary_min, salary_max, url, published_at
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
			&row.Location, &row.SalaryMin, &row.SalaryMax, &row.URL, &row.PublishedAt,
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
	stmt := `UPDATE jobs SET vector = $1, fit_score = $2 WHERE id = $3`
	_, err := s.DB.ExecContext(ctx, stmt, pq.Array(vector), fitScore, id)
	return err
}

type JobRow struct {
	ID, Source, Title, Company, Description, Location, URL string
	SalaryMin, SalaryMax                                   int
	PublishedAt                                            string // ISO-8601
	Vector                                                 pq.Float32Array
	FitScore                                               *float32
}
