from sqlalchemy import Column, String, ForeignKey, DateTime, func, Integer, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.session import Base, CompatibleUUID as UUID, CompatibleJSONB as JSONB
import uuid

class KnowledgeGraphNode(Base):
    __tablename__ = "knowledge_graph_nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # e.g., 'Methodology', 'Dataset', 'Institution'
    properties = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("project_id", "label", "type", name="uq_node_project_label"),
    )


class KnowledgeGraphRelation(Base):
    __tablename__ = "knowledge_graph_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_graph_nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_graph_nodes.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(100), nullable=False)  # e.g., 'INFLUENCES', 'UTILIZES'
    properties = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("project_id", "source_node_id", "target_node_id", "relation_type", name="uq_relation_project_nodes"),
    )


class AgentTask(Base):
    __tablename__ = "agent_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_type = Column(String(100), nullable=False)  # e.g., 'literature_review', 'gap_analysis'
    status = Column(String(50), default="pending", nullable=False)  # pending, running, completed, failed
    parameters = Column(JSONB, default=dict, nullable=False)
    result = Column(JSONB, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ResearchTrend(Base):
    __tablename__ = "research_trends"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    keyword = Column(String(255), unique=True, index=True, nullable=False)
    interest_score = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    analysis_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), nullable=False)  # e.g., 'Literature Review', 'SWOT Analysis'
    content = Column(String, nullable=False)  # Rich markdown output
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
