from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class RAGQueryRequest(BaseModel):
    project_id: UUID
    query_text: str
    limit: Optional[int] = Field(default=5, description="Number of source chunks to retrieve")
    hybrid_alpha: Optional[float] = Field(
        default=0.5, 
        ge=0.0, 
        le=1.0, 
        description="Weight for vector search (alpha) vs keyword search (1 - alpha)"
    )
    enable_compression: Optional[bool] = Field(
        default=True, 
        description="Enable LLM-based context compression to remove irrelevant text"
    )

class Citation(BaseModel):
    paper_id: UUID
    title: str
    authors: List[str]
    doi: Optional[str] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True

class CitationSource(BaseModel):
    citation_key: str = Field(..., description="Unique identifier for inline reference, e.g. [1]")
    citation: Citation
    chunk_index: int
    text: str
    score: float

class RAGQueryResponse(BaseModel):
    answer: str = Field(..., description="Synthesized, grounded answer with inline citations")
    sources: List[CitationSource] = Field(..., description="Attributed sources supporting the answer")
