from typing import Generator, Optional, List
import ollama
from config import config


class LLMService:
    """Service for interacting with self-hosted LLM via Ollama."""
    
    def __init__(self):
        self.client = ollama.Client(host=config.OLLAMA_HOST)
        self.model = config.OLLAMA_MODEL
    
    def generate_response(self, 
                          query: str, 
                          context: Optional[str] = None,
                          conversation_history: Optional[List[dict]] = None) -> Generator[str, None, None]:
        """
        Generate a streaming response from the LLM.
        
        Args:
            query: The user's question
            context: Optional context from vector database
            conversation_history: Optional list of previous messages
        
        Yields:
            Chunks of the response text
        """
        # Build the system prompt
        system_prompt = """You are Jarvis, an intelligent personal AI assistant for enterprise use. 
You are helpful, knowledgeable, and professional. You provide clear, concise, and accurate responses.
When given context from the knowledge base, use it to inform your answers.
If you don't know something, be honest about it."""
        
        # Build messages list
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if provided
        if conversation_history:
            messages.extend(conversation_history)
        
        # Build user message with context
        if context:
            user_message = f"""Based on the following context from the knowledge base:

{context}

User Question: {query}

Please provide a helpful response based on the context above. If the context doesn't contain relevant information, use your general knowledge but mention this."""
        else:
            user_message = query
        
        messages.append({"role": "user", "content": user_message})
        
        # Stream the response
        stream = self.client.chat(
            model=self.model,
            messages=messages,
            stream=True
        )
        
        for chunk in stream:
            if "message" in chunk and "content" in chunk["message"]:
                yield chunk["message"]["content"]
    
    def generate_simple_response(self, query: str) -> str:
        """Generate a non-streaming response."""
        response = self.client.chat(
            model=self.model,
            messages=[{"role": "user", "content": query}]
        )
        return response["message"]["content"]
    
    def check_health(self) -> bool:
        """Check if Ollama is running and the model is available."""
        try:
            models = self.client.list()
            model_names = [m["name"].split(":")[0] for m in models.get("models", [])]
            return self.model in model_names or f"{self.model}:latest" in [m["name"] for m in models.get("models", [])]
        except Exception:
            return False


# Singleton instance
llm_service = LLMService()
