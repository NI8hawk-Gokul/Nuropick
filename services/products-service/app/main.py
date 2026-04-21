from fastapi import FastAPI, HTTPException
from .schemas import ProductIn, ProductOut
import uuid

app = FastAPI(title="NeuroPick Products Service")

# in-memory store for demo
PRODUCTS = {}

@app.get("/health")
def health():
    return {"status": "ok", "service": "products"}

@app.post("/products", response_model=ProductOut)
def create_product(payload: ProductIn):
    pid = str(uuid.uuid4())
    product = payload.dict()
    product.update({"id": pid})
    PRODUCTS[pid] = product
    return product

@app.get("/products/{product_id}", response_model=ProductOut)
def get_product(product_id: str):
    p = PRODUCTS.get(product_id)
    if not p:
        raise HTTPException(status_code=404, detail="product not found")
    return p

@app.get("/products")
def list_products():
    return list(PRODUCTS.values())