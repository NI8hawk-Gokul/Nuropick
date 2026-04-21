from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import time

app = FastAPI(title="NeuroPick Ingestion Service")

class IngestRequest(BaseModel):
    source: str
    url: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "ingestion"}

@app.post("/ingest")
async def ingest(req: IngestRequest, background_tasks: BackgroundTasks):
    # TODO: implement connectors, parsing, normalization, deduplication
    background_tasks.add_task(_simulate_ingest, req.source, req.url)
    return {"status": "started"}

def _simulate_ingest(source: str, url: str):
    time.sleep(2)
    print(f"[ingestion] fetched {url} from {source}")