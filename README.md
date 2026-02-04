# 🤖 Jarvis - Personal AI Assistant

A personal AI assistant powered by a self-hosted LLM (LLaMA via Ollama) with vector database integration (Pinecone) for knowledge retrieval and a modern React.js chatbot interface.

![Jarvis AI Assistant](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi)
![Ollama](https://img.shields.io/badge/Ollama-LLaMA-purple?style=for-the-badge)

## ✨ Features

- 🧠 **Self-hosted LLM** - Run LLaMA locally via Ollama
- 📚 **Knowledge Base** - Store and retrieve documents with Pinecone vector search
- 💬 **Streaming Responses** - Real-time token streaming for natural conversation
- 🎨 **Premium UI** - Modern dark theme with glassmorphism effects
- 📱 **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites

1. **Install Ollama**:
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull LLaMA model**:
   ```bash
   ollama pull llama2
   ollama pull nomic-embed-text
   ```

3. **Get Pinecone API Key** (optional):
   - Sign up at [pinecone.io](https://www.pinecone.io)
   - Create an index and get your API key

### Installation

1. **Clone & Setup Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Configure environment
   cp .env.example .env
   # Edit .env with your Pinecone API key (optional)
   ```

2. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   ```

### Running

1. **Start Ollama** (in terminal 1):
   ```bash
   ollama serve
   ```

2. **Start Backend** (in terminal 2):
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```

3. **Start Frontend** (in terminal 3):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Open Browser**: http://localhost:5173

## 📁 Project Structure

```
Jarvis/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── requirements.txt     # Python dependencies
│   └── services/
│       ├── llm_service.py      # Ollama LLM integration
│       ├── embedding_service.py # Text embeddings
│       └── vector_service.py    # Pinecone integration
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main application
│   │   ├── index.css        # Premium styling
│   │   └── components/
│   │       ├── ChatInterface.jsx   # Chat UI
│   │       ├── MessageBubble.jsx   # Message display
│   │       └── KnowledgeBase.jsx   # Knowledge management
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🔧 Configuration

Edit `backend/.env` to configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_MODEL` | LLM model to use | `llama2` |
| `OLLAMA_EMBEDDING_MODEL` | Embedding model | `nomic-embed-text` |
| `PINECONE_API_KEY` | Your Pinecone API key | (required for knowledge base) |
| `PINECONE_INDEX_NAME` | Name of your Pinecone index | `jarvis-knowledge` |

## 📝 Usage

### Chat
Simply type your message and press Enter or click Send. Jarvis will respond using the LLM.

### Knowledge Base
1. Go to the "Knowledge Base" tab
2. Upload a `.txt` file or paste text directly
3. The content will be chunked and stored in Pinecone
4. When you chat, Jarvis will search the knowledge base for relevant context

## 🛠️ Tech Stack

- **Backend**: FastAPI, Python 3.10+
- **LLM**: Ollama (LLaMA 2/3)
- **Vector DB**: Pinecone
- **Frontend**: React 18, Vite
- **Styling**: Custom CSS with glassmorphism

## 📄 License

MIT License - Feel free to use and modify!
