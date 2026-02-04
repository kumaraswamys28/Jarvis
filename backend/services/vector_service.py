from typing import List, Optional, Dict, Any
from pinecone import Pinecone, ServerlessSpec
from config import config
from services.embedding_service import embedding_service
import uuid
import time


class VectorService:
    """Service for storing and retrieving vectors from Pinecone."""
    
    def __init__(self):
        self.pc = None
        self.index = None
        self._initialized = False
    
    def initialize(self) -> bool:
        """Initialize Pinecone connection and index."""
        if not config.PINECONE_API_KEY:
            print("Warning: Pinecone API key not set. Vector search disabled.")
            return False
        
        try:
            self.pc = Pinecone(api_key=config.PINECONE_API_KEY)
            
            # Check if index exists, create if not
            existing_indexes = [idx.name for idx in self.pc.list_indexes()]
            
            if config.PINECONE_INDEX_NAME not in existing_indexes:
                self.pc.create_index(
                    name=config.PINECONE_INDEX_NAME,
                    dimension=768,  # nomic-embed-text dimension
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                # Wait for index to be ready
                time.sleep(5)
            
            self.index = self.pc.Index(config.PINECONE_INDEX_NAME)
            self._initialized = True
            return True
            
        except Exception as e:
            print(f"Failed to initialize Pinecone: {e}")
            return False
    
    @property
    def is_initialized(self) -> bool:
        return self._initialized
    
    def upsert_document(self, 
                        text: str, 
                        metadata: Optional[Dict[str, Any]] = None,
                        doc_id: Optional[str] = None) -> List[str]:
        """
        Store a document in the vector database.
        
        Args:
            text: The document text
            metadata: Optional metadata to store with vectors
            doc_id: Optional document ID prefix
            
        Returns:
            List of vector IDs created
        """
        if not self._initialized:
            raise RuntimeError("Vector service not initialized")
        
        # Chunk the text
        chunks = embedding_service.chunk_text(text)
        
        # Generate embeddings
        embeddings = embedding_service.get_embeddings(chunks)
        
        # Prepare vectors for upsert
        vectors = []
        vector_ids = []
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vec_id = f"{doc_id or uuid.uuid4().hex}_{i}"
            vector_ids.append(vec_id)
            
            vec_metadata = {
                "text": chunk,
                "chunk_index": i,
                **(metadata or {})
            }
            
            vectors.append({
                "id": vec_id,
                "values": embedding,
                "metadata": vec_metadata
            })
        
        # Upsert in batches of 100
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch)
        
        return vector_ids
    
    def search(self, 
               query: str, 
               top_k: int = None,
               filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Search for similar documents.
        
        Args:
            query: The search query
            top_k: Number of results to return
            filter: Optional metadata filter
            
        Returns:
            List of matching documents with scores
        """
        if not self._initialized:
            return []
        
        top_k = top_k or config.TOP_K_RESULTS
        
        # Get query embedding
        query_embedding = embedding_service.get_embedding(query)
        
        # Search
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter
        )
        
        # Format results
        documents = []
        for match in results.get("matches", []):
            documents.append({
                "id": match["id"],
                "score": match["score"],
                "text": match.get("metadata", {}).get("text", ""),
                "metadata": match.get("metadata", {})
            })
        
        return documents
    
    def delete_document(self, doc_id_prefix: str) -> bool:
        """Delete all vectors with the given ID prefix."""
        if not self._initialized:
            return False
        
        try:
            # Pinecone doesn't support prefix deletion directly
            # We need to list and delete
            self.index.delete(filter={"doc_id": doc_id_prefix})
            return True
        except Exception as e:
            print(f"Failed to delete document: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics."""
        if not self._initialized:
            return {"initialized": False}
        
        stats = self.index.describe_index_stats()
        return {
            "initialized": True,
            "total_vectors": stats.get("total_vector_count", 0),
            "dimension": stats.get("dimension", 0)
        }


# Singleton instance
vector_service = VectorService()
