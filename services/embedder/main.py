from fastapi import FastAPI
from pydantic import BaseModel
from fastembed import TextEmbedding

# Load a lightweight 384-d model (fits in 512MB with room to spare)
# Alternatives that are still small:
#   "intfloat/e5-small-v2" (384-d), "Snowflake/snowflake-arctic-embed-xs" (384-d)
MODEL_NAME = "BAAI/bge-small-en-v1.5"

app = FastAPI()
model = TextEmbedding(model_name=MODEL_NAME)  # loads on first use

class Req(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME}

@app.post("/embed")
def embed(r: Req):
    # FastEmbed returns a generator; get the first vector
    vec = next(model.embed([r.text]))
    # Ensure plain Python list of floats
    return {"vector": list(map(float, vec))}