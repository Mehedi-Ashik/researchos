from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

class GapAnalysisRequest(BaseModel):
    project_id: UUID
    paper_id: Optional[UUID] = Field(default=None, description="Trigger analysis for a specific paper. If null, triggers project-wide cross-paper synthesis.")
    force_refresh: Optional[bool] = Field(default=False, description="Whether to ignore cached/saved gaps and run a fresh AI analysis.")

class GapResponse(BaseModel):
    id: UUID
    project_id: UUID
    paper_id: Optional[UUID] = None
    gap_type: str = Field(..., description="'limitation', 'future_work', 'novelty', 'opportunity'")
    title: str
    description: str
    original_text_quote: Optional[str] = None
    severity_score: float = Field(..., ge=0.0, le=1.0)
    feasibility_score: float = Field(..., ge=0.0, le=1.0)
    strategy: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GapUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    feasibility_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    strategy: Optional[str] = None

class GapAnalysisSummaryResponse(BaseModel):
    project_id: UUID
    total_analyzed_papers: int
    limitations: List[GapResponse]
    future_work: List[GapResponse]
    novelties: List[GapResponse]
    opportunities: List[GapResponse]
    synthesized_summary: str = Field(..., description="Project-wide executive summary summarizing the research gaps and pathways.")
    ResearchGap = GapResponse