package utils

func TruncateErr(err error) string {
	s := err.Error()
	if len(s) > 500 {
		return s[:500] + "…"
	}
	return s
}
