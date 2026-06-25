from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.paper import ResearchPaper, PaperEmbedding, PaperSummary
from app.schemas.paper import PaperCreate
from uuid import UUID

class PaperRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, paper_id: UUID) -> Optional[ResearchPaper]:
        return self.db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()

    def get_by_doi(self, doi: str) -> Optional[ResearchPaper]:
        return self.db.query(ResearchPaper).filter(ResearchPaper.doi == doi).first()

    def get_by_project(self, project_id: UUID, skip: int = 0, limit: int = 100) -> List[ResearchPaper]:
        return (
            self.db.query(ResearchPaper)
            .filter(ResearchPaper.project_id == project_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, paper_in: PaperCreate) -> ResearchPaper:
        db_obj = ResearchPaper(
            title=paper_in.title,
            authors=paper_in.authors,
            journal=paper_in.journal,
            publication_date=paper_in.publication_date,
            doi=paper_in.doi,
            url=paper_in.url,
            abstract=paper_in.abstract,
            project_id=paper_in.project_id
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def create_summary(self, paper_id: UUID, summary_text: str, key_takeaways: List[str], methodology: Optional[str] = None) -> PaperSummary:
        db_obj = PaperSummary(
            paper_id=paper_id,
            summary_text=summary_text,
            key_takeaways=key_takeaways,
            methodology=methodology
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def create_chunk_embedding(self, paper_id: UUID, chunk_index: int, chunk_text: str, embedding: List[float]) -> PaperEmbedding:
        db_obj = PaperEmbedding(
            paper_id=paper_id,
            chunk_index=chunk_index,
            chunk_text=chunk_text,
            embedding=embedding
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, paper_id: UUID) -> bool:
        paper = self.get_by_id(paper_id)
        if not paper:
            return False
        self.db.delete(paper)
        self.db.commit()
        return True

    def semantic_search(self, project_id: UUID, query_vector: List[float], limit: int = 5) -> List[Tuple[ResearchPaper, int, str, float]]:
        """
        Executes a cosine similarity search on embeddings associated with the specified project.
        Uses pgvector <=> cosine distance operator in PostgreSQL. If pgvector is not loaded, 
        or SQLite fallback is active, we compute cosine similarity natively in Python.
        """
        dialect_name = self.db.bind.dialect.name
        if dialect_name == "postgresql":
            # Convert list of floats to a PostgreSQL vector string representation: '[0.1, 0.2, ...]'
            vector_str = f"[{','.join(map(str, query_vector))}]"
            
            # Raw SQL query executing cosine similarity search within project papers
            query = text("""
                SELECT 
                    e.paper_id,
                    e.chunk_index,
                    e.chunk_text,
                    (1 - (e.embedding::vector <=> :query_vector::vector)) AS similarity
                FROM embeddings e
                JOIN research_papers r ON e.paper_id = r.id
                WHERE r.project_id = :project_id
                ORDER BY e.embedding::vector <=> :query_vector::vector
                LIMIT :limit
            """)
            
            try:
                results = self.db.execute(
                    query, 
                    {"project_id": project_id, "query_vector": vector_str, "limit": limit}
                ).fetchall()
                
                output = []
                for row in results:
                    paper_id, chunk_index, chunk_text, similarity = row
                    paper = self.get_by_id(paper_id)
                    if paper:
                        output.append((paper, chunk_index, chunk_text, float(similarity)))
                    
                return output
            except Exception as e:
                print(f"[PAPER REPO WARNING] PostgreSQL pgvector query failed: {str(e)}. Falling back to Python-based search.")
                # Fall through to the numpy computation below
        
        # SQLite or fallback numpy implementation
        import numpy as np
        all_records = self.get_all_embeddings_by_project(project_id)
        if not all_records:
            return []
            
        query_vector_np = np.array(query_vector, dtype=np.float32)
        query_norm = np.linalg.norm(query_vector_np)
        if query_norm == 0:
            query_norm = 1.0
            
        scored_results = []
        for paper, emb in all_records:
            emb_vector_np = np.array(emb.embedding, dtype=np.float32)
            emb_norm = np.linalg.norm(emb_vector_np)
            if emb_norm == 0:
                emb_norm = 1.0
            similarity = float(np.dot(query_vector_np, emb_vector_np) / (query_norm * emb_norm))
            scored_results.append((paper, emb.chunk_index, emb.chunk_text, similarity))
            
        # Sort by similarity descending
        scored_results.sort(key=lambda x: x[3], reverse=True)
        return scored_results[:limit]

    def get_all_embeddings_by_project(self, project_id: UUID) -> List[Tuple[ResearchPaper, PaperEmbedding]]:
        """
        Retrieves all research papers and their matching chunk embeddings for a specific project.
        """
        return (
            self.db.query(ResearchPaper, PaperEmbedding)
            .join(PaperEmbedding, ResearchPaper.id == PaperEmbedding.paper_id)
            .filter(ResearchPaper.project_id == project_id)
            .all()
        )
