# Remote Job Radar – Embedder Service

This is the **Python FastAPI microservice** for generating vector embeddings for job descriptions and user skills, enabling semantic search and fit scoring in Remote Job Radar.

## Overview

- **Language:** Python 3.8+
- **Framework:** FastAPI
- **Model:** SentenceTransformers (e.g., BAAI/bge-small-en-v1.5)
- **Purpose:** Generate vector embeddings for semantic similarity and job fit scoring
- **Integration:** Consumed by the Go aggregator service

## Directory Structure

- `main.py` – FastAPI app entry point
- `requirements.txt` – Python dependencies
- `pyproject.toml` – Project metadata
- `Dockerfile` – Containerization

## Environment & Configuration

- **Model selection:** Change model in `main.py` or via environment variable
- **Port:** Default is 8000 (can be changed in Dockerfile or FastAPI config)

## API Endpoints

### POST /embed

- **Request:** JSON body with `text` (string or list of strings)
- **Response:** JSON with `embeddings` (list of vectors)
- **Error Handling:** 400 for invalid input, 500 for model errors

### GET /health

- **Response:** `{ "ok": true }` if service is healthy

## Example Usage

```bash
curl -X POST http://localhost:8000/embed \
  -H 'Content-Type: application/json' \
  -d '{"text": "Senior React Developer with AWS experience"}'
```

## Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker build -t embedder-service .
docker run -p 8000:8000 embedder-service
```

## Notes

- Used by the Go aggregator for embedding jobs and skills
- Should be running before aggregator fetches jobs
- Logs errors and request info to stdout

## Future Improvements

- Add batching for large requests
- Support for additional models
- Add metrics and monitoring endpoints
