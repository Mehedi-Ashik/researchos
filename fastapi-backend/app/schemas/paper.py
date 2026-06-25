from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID

# Summary Schemas
class SummaryBase(BaseModel):
    summary_text: str
    key_takeaways: List[str]
    methodology: Optional[str] = None

class SummaryResponse(SummaryBase):
    id: UUID
    paper_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Paper Schemas
class PaperBase(BaseModel):
    title: str
    authors: List[str]
    journal: Optional[str] = None
    publication_date: Optional[date] = None
    doi: Optional[str] = None
    url: Optional[str] = None
    abstract: Optional[str] = None

class PaperCreate(PaperBase):
    project_id: UUID

class PaperResponse(PaperBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    summary: Optional[SummaryBase] = None

    class Config:
        from_attributes = True

# Embedding & Search Schemas
class PaperChunkResponse(BaseModel):
    id: UUID
    paper_id: UUID
    chunk_index: int
    chunk_text: str

    class Config:
        from_attributes = True

class PaperSearchResponse(BaseModel):
    paper: PaperResponse
    chunk_index: int
    chunk_text: str
    score: float
