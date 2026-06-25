from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Any
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.paper import PaperResponse, PaperSearchResponse
from app.services.research_engine import ResearchEngineService
from app.services.embedding_service import EmbeddingService
from app.repositories.paper_repo import PaperRepository

router = APIRouter()

@router.post("/upload", response_model=Any, status_code=status.HTTP_201_CREATED)
async def upload_research_paper(
    project_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Uploads a new research paper PDF.
    Extracts text, metadata, generates summaries, key-takeaways, chunks the text,
    creates dense embeddings, and indexes the document in the project vector database.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF files are supported."
        )
        
    try:
        # Read uploaded bytes
        pdf_bytes = await file.read()
        
        # Trigger Research Engine
        research_service = ResearchEngineService(db)
        result = research_service.process_and_ingest_pdf(
            project_id=project_id,
            filename=file.filename,
            pdf_bytes=pdf_bytes
        )
        
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during paper processing: {str(e)}"
        )


@router.get("/project/{project_id}", response_model=List[PaperResponse])
def get_project_papers(
    project_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves all ingested research papers associated with the specified workspace project.
    """
    paper_repo = PaperRepository(db)
    papers = paper_repo.get_by_project(project_id=project_id, skip=skip, limit=limit)
    return papers


@router.get("/{paper_id}", response_model=PaperResponse)
def get_paper_details(
    paper_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves full record metadata and abstract summaries for a single research paper.
    """
    paper_repo = PaperRepository(db)
    paper = paper_repo.get_by_id(paper_id)
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research paper record not found in database."
        )
    return paper


@router.post("/search", response_model=List[PaperSearchResponse])
def semantic_similarity_search(
    project_id: UUID = Form(...),
    query_text: str = Form(...),
    limit: int = Form(5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Performs high-dimensional semantic search across all document chunks in a project.
    Converts query text to an embedding, then ranks matching chunks using cosine similarity.
    """
    try:
        # 1. Generate query embedding vector
        query_vector = EmbeddingService.generate_embedding(query_text)
        
        # 2. Query nearest neighbor matches inside PostgreSQL database
        paper_repo = PaperRepository(db)
        results = paper_repo.semantic_search(
            project_id=project_id,
            query_vector=query_vector,
            limit=limit
        )
        
        # 3. Format response structure
        search_results = []
        for paper, chunk_index, chunk_text, score in results:
            search_results.append({
                "paper": paper,
                "chunk_index": chunk_index,
                "chunk_text": chunk_text,
                "score": score
            })
            
        return search_results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Semantic similarity search failed: {str(e)}"
        )


@router.delete("/{paper_id}", status_code=status.HTTP_200_OK)
def delete_paper(
    paper_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Deletes a research paper record along with its child summaries and vector index chunks.
    """
    paper_repo = PaperRepository(db)
    success = paper_repo.delete(paper_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research paper record not found in database."
        )
    return None
