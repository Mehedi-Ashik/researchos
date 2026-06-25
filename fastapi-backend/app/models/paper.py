from sqlalchemy import Column, String, ForeignKey, DateTime, func, Integer, Date, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base, CompatibleUUID as UUID, CompatibleJSONB as JSONB, CompatibleArray as ARRAY
import uuid

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(512), nullable=False)
    authors = Column(ARRAY(String), nullable=False)
    journal = Column(String(255), nullable=True)
    publication_date = Column(Date, nullable=True)
    doi = Column(String(100), unique=True, index=True, nullable=True)
    url = Column(String(1024), nullable=True)
    abstract = Column(String, nullable=True)
    
    # Association with Project via a many-to-many junction or direct reference.
    # To keep the model lightweight and robust, papers can belong to projects.
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    project = relationship("Project", backref="papers")
    embeddings = relationship("PaperEmbedding", back_populates="paper", cascade="all, delete-orphan")
    summary = relationship("PaperSummary", back_populates="paper", uselist=False, cascade="all, delete-orphan")


class PaperEmbedding(Base):
    __tablename__ = "embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    paper_id = Column(UUID(as_uuid=True), ForeignKey("research_papers.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(String, nullable=False)
    embedding = Column(ARRAY(Float), nullable=False)  # Map to postgres ARRAY or pgvector
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    paper = relationship("ResearchPaper", back_populates="embeddings")

    __table_args__ = (
        UniqueConstraint("paper_id", "chunk_index", name="uq_paper_chunk"),
    )


class PaperSummary(Base):
    __tablename__ = "summaries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    paper_id = Column(UUID(as_uuid=True), ForeignKey("research_papers.id", ondelete="CASCADE"), unique=True, nullable=False)
    summary_text = Column(String, nullable=False)
    key_takeaways = Column(JSONB, nullable=False)  # JSON Array of strings or structured data
    methodology = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    paper = relationship("ResearchPaper", back_populates="summary")
