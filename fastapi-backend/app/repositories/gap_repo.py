from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.gap_analysis import ResearchGap
from app.schemas.gap_analysis import GapResponse, GapUpdateRequest
from uuid import UUID

class GapRepository:
    def __init__(self, db: Session):
        self.db = db

    def save_gap(
        self,
        project_id: UUID,
        gap_type: str,
        title: str,
        description: str,
        paper_id: Optional[UUID] = None,
        original_text_quote: Optional[str] = None,
        severity_score: float = 0.5,
        feasibility_score: float = 0.5,
        strategy: Optional[str] = None
    ) -> ResearchGap:
        db_obj = ResearchGap(
            project_id=project_id,
            paper_id=paper_id,
            gap_type=gap_type,
            title=title,
            description=description,
            original_text_quote=original_text_quote,
            severity_score=severity_score,
            feasibility_score=feasibility_score,
            strategy=strategy
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_by_project(self, project_id: UUID) -> List[ResearchGap]:
        return self.db.query(ResearchGap).filter(ResearchGap.project_id == project_id).order_by(ResearchGap.created_at.desc()).all()

    def get_by_paper(self, paper_id: UUID) -> List[ResearchGap]:
        return self.db.query(ResearchGap).filter(ResearchGap.paper_id == paper_id).order_by(ResearchGap.created_at.desc()).all()

    def get_by_id(self, gap_id: UUID) -> Optional[ResearchGap]:
        return self.db.query(ResearchGap).filter(ResearchGap.id == gap_id).first()

    def delete_by_project(self, project_id: UUID, paper_id: Optional[UUID] = None):
        query = self.db.query(ResearchGap).filter(ResearchGap.project_id == project_id)
        if paper_id:
            query = query.filter(ResearchGap.paper_id == paper_id)
        else:
            # If paper_id is None, delete project-wide gaps (where paper_id is null) or all gaps
            pass
        query.delete(synchronize_session=False)
        self.db.commit()

    def update_gap(self, gap_id: UUID, payload: GapUpdateRequest) -> Optional[ResearchGap]:
        db_obj = self.get_by_id(gap_id)
        if not db_obj:
            return None
        
        update_data = payload.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
            
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete_gap(self, gap_id: UUID) -> bool:
        db_obj = self.get_by_id(gap_id)
        if not db_obj:
            return False
        self.db.delete(db_obj)
        self.db.commit()
        return True
