"""Embedder FastAPI service for generating text embeddings."""

# Standard library imports
import hashlib
import logging
import sys

# Third-party imports
from fastapi import FastAPI, HTTPException, Request
from fastembed import TextEmbedding
from pydantic import BaseModel

# Load a lightweight 384-d model (fits in 512MB with room to spare)
# Alternatives that are still small:
#   "intfloat/e5-small-v2" (384-d), "Snowflake/snowflake-arctic-embed-xs" (384-d)

# Configure logging to stdout for cloud platforms (e.g., Render)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

MODEL_NAME = "BAAI/bge-small-en-v1.5"


app = FastAPI()
model = TextEmbedding(model_name=MODEL_NAME)  # loads on first use
logging.info(f"Embedder service started with model: {MODEL_NAME}")



class Req(BaseModel):
    text: str



@app.get("/health")
async def health(request: Request):
    logging.info(f"Health check from {request.client.host}")
    return {"ok": True, "model": MODEL_NAME}


@app.get("/healthz")
async def healthz():
    return {"ok": True}


@app.post("/embed")
async def embed(r: Req, request: Request):
    text_hash = hashlib.sha256(r.text.encode("utf-8")).hexdigest()

    # Extract first 100 chars for identification
    text_preview = r.text[:100].replace("\n", " ").replace("\r", "")

    logging.info(
        f"[EMBED_START] from {request.client.host} | text_length: {len(r.text)} | "
        f"sha256: {text_hash} | preview: '{text_preview}...'"
    )
    try:
        # FastEmbed returns a generator; get the first vector
        vec = next(model.embed([r.text]))
        # Ensure plain Python list of floats
        logging.info(
            f"[EMBED_SUCCESS] text_length: {len(r.text)} | vector_dim: {len(vec)} | "
            f"sha256: {text_hash}"
        )
        return {"vector": list(map(float, vec))}
    except Exception as e:
        logging.error(
            f"[EMBED_FAILED] text_length: {len(r.text)} | sha256: {text_hash} | error: {e}"
        )
        raise HTTPException(status_code=500, detail=str(e)) from e