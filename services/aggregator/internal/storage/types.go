package storage

import "github.com/lib/pq"

type JobRow struct {
	ID, Source, Title, Company, Description, Location, WorkType, URL string
	SalaryMin, SalaryMax                                             int
	PublishedAt                                                      string // ISO-8601
	Vector                                                           pq.Float32Array
	FitScore                                                         *float32
}

type UserSkillEmbedJob struct {
	UserID   string
	Skills   string
	Attempts int
}

// UserProfileEmbedJobStatus represents the status of a user skill embed job
type UserProfileEmbedJobStatus string

const (
	StatusPending    UserProfileEmbedJobStatus = "pending"
	StatusCompleted  UserProfileEmbedJobStatus = "completed"
	StatusFailed     UserProfileEmbedJobStatus = "failed"
	StatusProcessing UserProfileEmbedJobStatus = "processing"
	StatusDone       UserProfileEmbedJobStatus = "done"
)
