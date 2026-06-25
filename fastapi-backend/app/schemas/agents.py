from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import UUID

# Task Schemas
class TaskCreate(BaseModel):
    project_id: UUID
    task_type: str = Field(..., description="Type of task: e.g., 'literature_review', 'gap_analysis'")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)

class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    task_type: str
    status: str
    parameters: Dict[str, Any]
    result: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Knowledge Graph Node & Relation Schemas
class GraphNodeCreate(BaseModel):
    project_id: UUID
    label: str
    type: str
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)

class GraphNodeUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

class GraphNodeResponse(BaseModel):
    id: UUID
    project_id: UUID
    label: str
    type: str
    properties: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class GraphRelationCreate(BaseModel):
    project_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relation_type: str
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict)

class GraphRelationResponse(BaseModel):
    id: UUID
    project_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relation_type: str
    properties: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class EntityExtractionRequest(BaseModel):
    text: str

class ExtractedNode(BaseModel):
    label: str
    type: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class ExtractedRelation(BaseModel):
    source_label: str
    source_type: str
    target_label: str
    target_type: str
    relation_type: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class ExtractionResponse(BaseModel):
    nodes: List[GraphNodeResponse]
    relations: List[GraphRelationResponse]

class KnowledgeGraphResponse(BaseModel):
    nodes: List[GraphNodeResponse]
    relations: List[GraphRelationResponse]

# Report Schemas
class ReportResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    report_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
