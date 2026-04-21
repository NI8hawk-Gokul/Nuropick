from pydantic import BaseModel
from typing import Optional

class BaseOut(BaseModel):
    id: str
    created_at: Optional[str]