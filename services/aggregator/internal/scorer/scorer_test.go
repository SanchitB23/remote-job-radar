package scorer

import (
	"testing"
)

func TestCosine(t *testing.T) {
	tests := []struct {
		name     string
		a        []float32
		b        []float32
		expected float32
	}{
		{
			name:     "identical vectors",
			a:        []float32{1, 0, 0},
			b:        []float32{1, 0, 0},
			expected: 1.0,
		},
		{
			name:     "orthogonal vectors",
			a:        []float32{1, 0},
			b:        []float32{0, 1},
			expected: 0.0,
		},
		{
			name:     "opposite vectors",
			a:        []float32{1, 0},
			b:        []float32{-1, 0},
			expected: -1.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := Cosine(tt.a, tt.b)
			if abs(result-tt.expected) > 0.001 {
				t.Errorf("Cosine(%v, %v) = %f, want %f", tt.a, tt.b, result, tt.expected)
			}
		})
	}
}

func TestFitScore(t *testing.T) {
	a := []float32{1, 0, 0}
	b := []float32{1, 0, 0}
	score := FitScore(a, b)

	if score != 100.0 {
		t.Errorf("FitScore for identical vectors should be 100, got %f", score)
	}
}

func TestPreprocessText(t *testing.T) {
	tests := []struct {
		name         string
		input        string
		expectHTML   bool
		expectLength bool
	}{
		{
			name:         "plain text",
			input:        "This is a plain text job description",
			expectHTML:   false,
			expectLength: false,
		},
		{
			name:         "HTML content",
			input:        "<div>This is <strong>HTML</strong> content</div>",
			expectHTML:   true,
			expectLength: false,
		},
		{
			name:         "empty string",
			input:        "",
			expectHTML:   false,
			expectLength: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, wasHTML := preprocessText(tt.input, 10000) // Using default max text length

			if tt.input == "" && result != "" {
				t.Errorf("Expected empty result for empty input, got: %s", result)
			}

			if wasHTML != tt.expectHTML {
				t.Errorf("Expected wasHTML=%v, got %v", tt.expectHTML, wasHTML)
			}

			if tt.expectHTML && result == tt.input {
				t.Errorf("HTML content should be converted, but result equals input")
			}
		})
	}
}

func TestConvertHTMLToText(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "simple HTML",
			input:    "<p>Hello <strong>world</strong></p>",
			expected: "Hello world",
		},
		{
			name:     "list items",
			input:    "<ul><li>Item 1</li><li>Item 2</li></ul>",
			expected: "• Item 1\n• Item 2",
		},
		{
			name:     "HTML entities",
			input:    "&lt;script&gt;alert('test')&lt;/script&gt;",
			expected: "alert('test')", // HTML tags are removed after entity decoding
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertHTMLToText(tt.input)
			if result != tt.expected {
				t.Errorf("convertHTMLToText(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

// Helper function for floating point comparison
func abs(x float32) float32 {
	if x < 0 {
		return -x
	}
	return x
}
