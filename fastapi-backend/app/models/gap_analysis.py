from sqlalchemy import Column, String, ForeignKey, DateTime, func, Float
from sqlalchemy.orm import relationship
from app.db.session import Base, CompatibleUUID as UUID
import uuid

class ResearchGap(Base):
    __tablename__ = "research_gaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    paper_id = Column(UUID(as_uuid=True), ForeignKey("research_papers.id", ondelete="CASCADE"), nullable=True)
    gap_type = Column(String(50), nullable=False)  # 'limitation', 'future_work', 'novelty', 'opportunity'
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    original_text_quote = Column(String, nullable=True)
    severity_score = Column(Float, nullable=False, default=0.5)
    feasibility_score = Column(Float, nullable=False, default=0.5)
    strategy = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    project = relationship("Project", backref="gaps")
    paper = relationship("ResearchPaper", backref="gaps")
