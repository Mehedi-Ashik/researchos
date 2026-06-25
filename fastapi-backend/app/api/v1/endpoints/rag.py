from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import RAGService

router = APIRouter()

@router.post("/query", response_model=RAGQueryResponse, status_code=status.HTTP_200_OK)
def query_rag_knowledge_base(
    payload: RAGQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Executes an Advanced RAG system pipeline:
    - Retrives relevant research document chunks using Hybrid Vector + Keyword Search
    - Compresses the extracted context passages to optimize the context window
    - Tracks and maps structured inline citations and source attributions
    - Generates a scientifically grounded response using Gemini models
    """
    try:
        rag_service = RAGService(db)
        response = rag_service.execute_rag_pipeline(payload)
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"The RAG query pipeline encountered an unexpected error: {str(e)}"
        )
