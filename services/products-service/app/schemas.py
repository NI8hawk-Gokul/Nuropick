from pydantic import BaseModel
from typing import Optional, Dict, Any

class ProductIn(BaseModel):
    title: str
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = {}

class ProductOut(ProductIn):
    id: str