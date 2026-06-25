from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.agent_models import KnowledgeGraphNode, KnowledgeGraphRelation, AgentTask, GeneratedReport, ResearchTrend
from app.schemas.agents import GraphNodeCreate, GraphRelationCreate, TaskCreate
from uuid import UUID

class AgentRepository:
    def __init__(self, db: Session):
        self.db = db

    # Task Operations
    def create_task(self, task_in: TaskCreate) -> AgentTask:
        db_obj = AgentTask(
            project_id=task_in.project_id,
            task_type=task_in.task_type,
            status="pending",
            parameters=task_in.parameters or {},
            result={}
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_task(self, task_id: UUID) -> Optional[AgentTask]:
        return self.db.query(AgentTask).filter(AgentTask.id == task_id).first()

    def get_tasks_by_project(self, project_id: UUID) -> List[AgentTask]:
        return self.db.query(AgentTask).filter(AgentTask.project_id == project_id).order_by(AgentTask.created_at.desc()).all()

    def update_task_status(self, task_id: UUID, status: str, result: Optional[dict] = None) -> Optional[AgentTask]:
        db_obj = self.get_task(task_id)
        if not db_obj:
            return None
        db_obj.status = status
        if result is not None:
            db_obj.result = result
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    # Knowledge Graph Operations
    def get_or_create_node(self, node_in: GraphNodeCreate) -> KnowledgeGraphNode:
        existing = (
            self.db.query(KnowledgeGraphNode)
            .filter(
                KnowledgeGraphNode.project_id == node_in.project_id,
                KnowledgeGraphNode.label == node_in.label,
                KnowledgeGraphNode.type == node_in.type
            )
            .first()
        )
        if existing:
            return existing

        db_obj = KnowledgeGraphNode(
            project_id=node_in.project_id,
            label=node_in.label,
            type=node_in.type,
            properties=node_in.properties or {}
        )
        self.db.add(db_obj)
        try:
            self.db.commit()
            self.db.refresh(db_obj)
        except Exception:
            self.db.rollback()
            # Double check if created in race condition
            existing = (
                self.db.query(KnowledgeGraphNode)
                .filter(
                    KnowledgeGraphNode.project_id == node_in.project_id,
                    KnowledgeGraphNode.label == node_in.label,
                    KnowledgeGraphNode.type == node_in.type
                )
                .first()
            )
            if existing:
                return existing
            raise
        return db_obj

    def create_relation(self, relation_in: GraphRelationCreate) -> KnowledgeGraphRelation:
        existing = (
            self.db.query(KnowledgeGraphRelation)
            .filter(
                KnowledgeGraphRelation.project_id == relation_in.project_id,
                KnowledgeGraphRelation.source_node_id == relation_in.source_node_id,
                KnowledgeGraphRelation.target_node_id == relation_in.target_node_id,
                KnowledgeGraphRelation.relation_type == relation_in.relation_type
            )
            .first()
        )
        if existing:
            return existing

        db_obj = KnowledgeGraphRelation(
            project_id=relation_in.project_id,
            source_node_id=relation_in.source_node_id,
            target_node_id=relation_in.target_node_id,
            relation_type=relation_in.relation_type,
            properties=relation_in.properties or {}
        )
        self.db.add(db_obj)
        try:
            self.db.commit()
            self.db.refresh(db_obj)
        except Exception:
            self.db.rollback()
            existing = (
                self.db.query(KnowledgeGraphRelation)
                .filter(
                    KnowledgeGraphRelation.project_id == relation_in.project_id,
                    KnowledgeGraphRelation.source_node_id == relation_in.source_node_id,
                    KnowledgeGraphRelation.target_node_id == relation_in.target_node_id,
                    KnowledgeGraphRelation.relation_type == relation_in.relation_type
                )
                .first()
            )
            if existing:
                return existing
            raise
        return db_obj

    def get_project_graph(self, project_id: UUID) -> tuple[List[KnowledgeGraphNode], List[KnowledgeGraphRelation]]:
        nodes = self.db.query(KnowledgeGraphNode).filter(KnowledgeGraphNode.project_id == project_id).all()
        relations = self.db.query(KnowledgeGraphRelation).filter(KnowledgeGraphRelation.project_id == project_id).all()
        return nodes, relations

    # Report Operations
    def create_report(self, project_id: UUID, title: str, report_type: str, content: str) -> GeneratedReport:
        db_obj = GeneratedReport(
            project_id=project_id,
            title=title,
            report_type=report_type,
            content=content
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_reports_by_project(self, project_id: UUID) -> List[GeneratedReport]:
        return self.db.query(GeneratedReport).filter(GeneratedReport.project_id == project_id).order_by(GeneratedReport.created_at.desc()).all()

    def get_report(self, report_id: UUID) -> Optional[GeneratedReport]:
        return self.db.query(GeneratedReport).filter(GeneratedReport.id == report_id).first()
