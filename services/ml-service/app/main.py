from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="NeuroPick ML Service (inference stubs)")

class TextIn(BaseModel):
    text: str

class SentimentOut(BaseModel):
    sentiment: str
    score: float
    aspects: List[Dict]

@app.get("/health")
def health():
    return {"status": "ok", "service": "ml"}

@app.post("/infer/sentiment", response_model=SentimentOut)
def infer_sentiment(payload: TextIn):
    # TODO: hook up real transformer model
    return {"sentiment": "positive", "score": 0.85, "aspects": [{"name":"battery","sentiment":"positive","score":0.9}]}

@app.post("/infer/summarize")
def infer_summarize(texts: List[TextIn]):
    # TODO: real summarizer (T5/BART)
    combined = " ".join([t.text for t in texts][:6])
    summary = combined[:200] + ("..." if len(combined) > 200 else "")
    return {"summary": summary}