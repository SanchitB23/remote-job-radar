package scorer

import (
	"context"
	"math"

	"github.com/sanchitb23/remote-job-radar/aggregator/internal/storage"
)

func Cosine(a, b []float32) float32 {
	var dot, na, nb float32
	for i := range a {
		dot += a[i] * b[i]
		na += a[i] * a[i]
		nb += b[i] * b[i]
	}
	return dot / float32(math.Sqrt(float64(na*nb+1e-9)))
}

// Returns fit 0-100
func FitScore(jobVec, skillVec []float32) float32 {
	return Cosine(jobVec, skillVec) * 100
}

// Update rows that lack vector/fit
func ScoreNewRows(ctx context.Context, st *storage.Store, skillVec []float32) error {
	rows, err := st.FetchRowsNeedingVector(ctx) // you write this query
	if err != nil {
		return err
	}
	for _, r := range rows {
		vec, err := Embed(ctx, r.Title+" "+r.Description)
		if err != nil {
			continue
		}
		fit := FitScore(vec, skillVec)
		if err := st.UpdateVectorAndFit(ctx, r.ID, vec, fit); err != nil {
			return err
		}
	}
	return nil
}
