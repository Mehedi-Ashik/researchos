from fastapi import APIRouter
from app.api.v1.endpoints import auth, papers, rag, gap_analysis, agents

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(papers.router, prefix="/papers", tags=["PDF Research Engine"])
api_router.include_router(rag.router, prefix="/rag", tags=["Advanced RAG System"])
api_router.include_router(gap_analysis.router, prefix="/gap-analysis", tags=["AI Research Gap Analysis Engine"])
api_router.include_router(agents.router, prefix="/agents", tags=["Multi-Agent System Workspace"])
