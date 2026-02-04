from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json

from config import config
from services.llm_service import llm_service
from services.vector_service import vector_service

# Initialize FastAPI app
app = FastAPI(
    title="Jarvis AI Assistant",
    description="Personal AI Assistant powered by self-hosted LLM",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = None
    use_knowledge_base: bool = True


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[dict]] = None


class DocumentRequest(BaseModel):
    text: str
    title: Optional[str] = None
    metadata: Optional[dict] = None


class HealthResponse(BaseModel):
    status: str
    llm_available: bool
    vector_db_available: bool
    model: str


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    # Try to initialize vector service
    vector_service.initialize()
    print(f"Jarvis API started. LLM Model: {config.OLLAMA_MODEL}")


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check the health of all services."""
    return HealthResponse(
        status="healthy",
        llm_available=llm_service.check_health(),
        vector_db_available=vector_service.is_initialized,
        model=config.OLLAMA_MODEL
    )


# Chat endpoint (streaming)
@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Stream chat response from LLM."""
    
    # Get context from knowledge base if enabled
    context = None
    sources = []
    
    if request.use_knowledge_base and vector_service.is_initialized:
        results = vector_service.search(request.message)
        if results:
            context = "\n\n---\n\n".join([r["text"] for r in results])
            sources = [{"id": r["id"], "score": r["score"]} for r in results]
    
    # Convert conversation history to dict format
    history = None
    if request.conversation_history:
        history = [{"role": m.role, "content": m.content} for m in request.conversation_history]
    
    def generate():
        for chunk in llm_service.generate_response(
            query=request.message,
            context=context,
            conversation_history=history
        ):
            yield f"data: {json.dumps({'content': chunk, 'sources': sources if sources else None})}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# Chat endpoint (non-streaming)
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Get chat response from LLM (non-streaming)."""
    
    # Get context from knowledge base if enabled
    context = None
    sources = []
    
    if request.use_knowledge_base and vector_service.is_initialized:
        results = vector_service.search(request.message)
        if results:
            context = "\n\n---\n\n".join([r["text"] for r in results])
            sources = results
    
    # Convert conversation history to dict format
    history = None
    if request.conversation_history:
        history = [{"role": m.role, "content": m.content} for m in request.conversation_history]
    
    # Generate response
    response_text = ""
    for chunk in llm_service.generate_response(
        query=request.message,
        context=context,
        conversation_history=history
    ):
        response_text += chunk
    
    return ChatResponse(response=response_text, sources=sources if sources else None)


# Knowledge base endpoints
@app.post("/knowledge/add")
async def add_knowledge(request: DocumentRequest):
    """Add a document to the knowledge base."""
    if not vector_service.is_initialized:
        raise HTTPException(status_code=503, detail="Vector database not initialized")
    
    metadata = request.metadata or {}
    if request.title:
        metadata["title"] = request.title
    
    vector_ids = vector_service.upsert_document(
        text=request.text,
        metadata=metadata
    )
    
    return {"status": "success", "vectors_created": len(vector_ids)}


@app.post("/knowledge/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None)
):
    """Upload a text file to the knowledge base."""
    if not vector_service.is_initialized:
        raise HTTPException(status_code=503, detail="Vector database not initialized")
    
    # Read file content
    content = await file.read()
    text = content.decode("utf-8")
    
    metadata = {"filename": file.filename}
    if title:
        metadata["title"] = title
    
    vector_ids = vector_service.upsert_document(
        text=text,
        metadata=metadata
    )
    
    return {
        "status": "success",
        "filename": file.filename,
        "vectors_created": len(vector_ids)
    }


@app.get("/knowledge/search")
async def search_knowledge(query: str, top_k: int = 5):
    """Search the knowledge base."""
    if not vector_service.is_initialized:
        raise HTTPException(status_code=503, detail="Vector database not initialized")
    
    results = vector_service.search(query, top_k=top_k)
    return {"results": results}


@app.get("/knowledge/stats")
async def knowledge_stats():
    """Get knowledge base statistics."""
    return vector_service.get_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
