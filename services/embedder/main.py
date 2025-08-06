from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
app = FastAPI()

class Req(BaseModel):
    text: str

@app.post("/embed")
def embed(r: Req):
    v = model.encode([r.text])[0]       # list of 384 floats
    return {"vector": v.tolist()}       # convert numpy array to list