# Copilot Commit Instructions

## Commit Message Guidelines

- Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.
- Format: `<type>[optional scope]: <title>`
  - Description (optional): Add a longer explanation below the title, separated by a blank line.

- Types: feat, fix, docs, style, refactor, perf, test, chore
- Scopes: api, web, aggregator, embedder, pipeline, ui, db (or leave blank)
- Keep the header (title) under 50 characters (recommended), and NEVER exceed 90 characters (required by commitlint). Use imperative mood.
- Separate body from header with a blank line. Wrap body lines at 90 characters.
- Use `BREAKING CHANGE:` in the footer for breaking changes.
- Reference issues in the footer if needed.

### Examples

```
feat(pipeline): add drag-and-drop functionality to kanban board
fix(api): resolve job fetching pagination issue
docs: update deployment instructions
refactor(web): improve error handling in job components
chore(deps): update Next.js to v15.4.5
```

### Tools

- commitlint: Enforces commit format
- commitizen: (Optional) Interactive commit prompts

### Additional Notes

- See `.github/copilot-instructions.md` for project architecture and conventions.
- Follow project-specific scopes and patterns for clarity.
- Use clear, concise language and avoid ambiguous descriptions.
