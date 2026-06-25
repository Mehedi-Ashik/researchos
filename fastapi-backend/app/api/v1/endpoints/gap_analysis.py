from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.gap_analysis import GapAnalysisRequest, GapAnalysisSummaryResponse, GapResponse, GapUpdateRequest
from app.services.gap_analysis_service import GapAnalysisService
from app.repositories.gap_repo import GapRepository

router = APIRouter()

@router.post("/analyze", response_model=GapAnalysisSummaryResponse, status_code=status.HTTP_200_OK)
def run_research_gap_analysis(
    payload: GapAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Triggers the AI Research Gap Analysis Engine:
    - Analyzes research papers associated with the project workspace.
    - Runs structured extraction for Limitations, Future Work, and Novel contributions.
    - Synthesizes workspace-wide High-Impact Research Opportunities.
    - Saves findings in the project database for curation.
    """
    try:
        service = GapAnalysisService(db)
        response = service.analyze_research_gaps(payload)
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gap analysis engine execution failed: {str(e)}"
        )


@router.get("/project/{project_id}", response_model=List[GapResponse])
def get_project_gaps(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves all curated/saved research gaps, novelties, and opportunities for the project.
    """
    try:
        gap_repo = GapRepository(db)
        gaps = gap_repo.get_by_project(project_id)
        return gaps
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve project gaps: {str(e)}"
        )


@router.put("/{gap_id}", response_model=GapResponse)
def update_gap_details(
    gap_id: UUID,
    payload: GapUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Updates details of a curated research gap (e.g., strategy, severity score, or feasibility).
    """
    gap_repo = GapRepository(db)
    updated_gap = gap_repo.update_gap(gap_id, payload)
    if not updated_gap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research gap record not found."
        )
    return updated_gap


@router.delete("/{gap_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gap_record(
    gap_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Deletes a research gap record from the curated project workspace.
    """
    gap_repo = GapRepository(db)
    success = gap_repo.delete_gap(gap_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research gap record not found."
        )
    return None
