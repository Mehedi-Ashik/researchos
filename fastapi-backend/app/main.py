from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base

# Import models to register them on Base metadata
from app.models.user import User
from app.models.project import Project
from app.models.paper import ResearchPaper, PaperEmbedding, PaperSummary
from app.models.agent_models import KnowledgeGraphNode, KnowledgeGraphRelation, AgentTask, ResearchTrend, GeneratedReport
from app.models.gap_analysis import ResearchGap

def create_app() -> FastAPI:
    # Ensure all tables are created in the database
    try:
        Base.metadata.create_all(bind=engine)
        print("[DATABASE] Successfully verified and initialized all database tables.")
    except Exception as e:
        print(f"[DATABASE ERROR] Table initialization failed: {str(e)}")

    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="FastAPI Backend for ResearchOS - AI-Powered Autonomous Research Intelligence Platform",
        version="0.1.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Set up CORS middleware
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Include API Routers (to be created in subsequent steps)
    from app.api.v1.api import api_router
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.get("/", tags=["Health"])
    async def health_check():
        return {
            "status": "online",
            "project": settings.PROJECT_NAME,
            "version": "0.1.0"
        }

    return app

app = create_app()
