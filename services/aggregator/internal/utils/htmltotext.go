package utils

import (
	"html"
	"regexp"
	"strings"
)

var (
	htmlDetectionRegex = regexp.MustCompile(`<[a-zA-Z][^>]*>`)
	blockElements      = regexp.MustCompile(`(?i)</(div|p|br|h[1-6]|li|tr)>`)
	listItems          = regexp.MustCompile(`(?i)<li[^>]*>`)
	htmlTagRegex       = regexp.MustCompile(`<[^>]*>`)
	whitespaceRegex    = regexp.MustCompile(`[ \t]+`)
	lineBreakRegex     = regexp.MustCompile(`\n\s*\n`)
)

// ConvertHTMLToText converts HTML content to plain text
func ConvertHTMLToText(htmlContent string) string {
	// First, unescape HTML entities
	text := html.UnescapeString(htmlContent)

	// Replace common block elements with line breaks for better readability
	text = blockElements.ReplaceAllString(text, "\n")

	// Replace list items with bullet points
	text = listItems.ReplaceAllString(text, "\n• ")

	// Remove all remaining HTML tags
	text = htmlTagRegex.ReplaceAllString(text, " ")

	// Clean up multiple whitespace characters but preserve line breaks
	text = whitespaceRegex.ReplaceAllString(text, " ")

	// Clean up multiple line breaks
	text = lineBreakRegex.ReplaceAllString(text, "\n")

	// Remove leading/trailing whitespace
	text = strings.TrimSpace(text)

	return text
}

// PreprocessText cleans and prepares text for embedding or storage
func PreprocessText(text string, maxTextLength int) (string, bool) {
	if text == "" {
		return "", false
	}

	var wasHTML bool
	// Convert HTML to plain text if it appears to contain HTML
	if htmlDetectionRegex.MatchString(text) {
		text = ConvertHTMLToText(text)
		wasHTML = true
	}

	// Truncate very long text if maxTextLength is set (>0)
	if maxTextLength > 0 && len(text) > maxTextLength {
		text = text[:maxTextLength]
	}

	return strings.TrimSpace(text), wasHTML
}
