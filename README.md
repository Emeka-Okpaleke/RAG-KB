# RAG Knowledge Base

Enterprise-grade knowledge base with **Retrieval-Augmented Generation (RAG)** powered Q&A. Upload documents (PDF, DOCX, TXT, Markdown), ask natural language questions, and get AI-generated answers with source citations.

## Tech Stack

### Backend
- **Python 3.11+** / **FastAPI** — REST API
- **MongoDB** (Motor) — Document & user metadata
- **ChromaDB** — Vector store for semantic search
- **Ollama / Groq** — LLM for embeddings & answer generation
- **Pydantic** — Data validation

### Frontend
- **Next.js 14** (App Router) — React framework
- **TailwindCSS** — Styling
- **Lucide React** — Icons
- **React Dropzone** — File uploads
- **React Markdown** — Rendered AI responses

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────────┐
│  Next.js    │────▸│  FastAPI Backend                                 │
│  Frontend   │◂────│                                                  │
│             │     │  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  • Auth     │     │  │  Auth    │  │ Document  │  │  RAG Engine  │  │
│  • Upload   │     │  │  (JWT)   │  │ Ingestion │  │              │  │
│  • Chat Q&A │     │  └──────────┘  │ Pipeline  │  │ 1. Embed Q   │  │
│  • Dashboard│     │                │           │  │ 2. Vector    │  │
│             │     │                │ Extract → │  │    Search    │  │
└─────────────┘     │                │ Chunk →   │  │ 3. LLM Gen  │  │
                    │                │ Embed →   │  │ 4. Citations │  │
                    │                │ Store     │  └──────────────┘  │
                    │                └───────────┘                    │
                    │  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
                    │  │ MongoDB  │  │ ChromaDB  │  │ Ollama/Groq  │  │
                    │  │ metadata │  │ vectors   │  │ LLM + embed  │  │
                    │  └──────────┘  └───────────┘  └──────────────┘  │
                    └──────────────────────────────────────────────────┘
```

### RAG Pipeline

```
User Question
    ↓
Generate query embedding (Ollama nomic-embed-text)
    ↓
Semantic search across ChromaDB collections (cosine similarity)
    ↓
Retrieve top-K relevant chunks with metadata
    ↓
Build prompt: system instructions + context chunks + question
    ↓
LLM generates answer (Ollama llama3.2 or Groq)
    ↓
Return answer + source citations (document name, chunk, relevance score)
```

---

## Prerequisites

| Requirement | Version | Download |
|-------------|---------|----------|
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | 6.0+ | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Ollama** | Latest | [ollama.com](https://ollama.com/download) |

---

## Getting Started

### 1. Clone & Setup

```bash
git clone https://github.com/YOUR_USERNAME/rag-knowledge-base.git
cd rag-knowledge-base
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
venv\Scripts\activate

# Activate (Linux/macOS)
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
copy env.example .env    # Windows
# cp env.example .env    # Linux/macOS
```

Edit `.env` with your MongoDB connection string and preferred settings.

### 3. Setup Ollama Models

```bash
# Pull the LLM model
ollama pull llama3.2:latest

# Pull the embedding model
ollama pull nomic-embed-text:latest

# Verify
ollama list
```

### 4. Start the Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

You should see:
```
[DB] Connected to MongoDB: rag_knowledge_base
[Server] RAG Knowledge Base API running on 0.0.0.0:8000
```

API docs available at: **http://localhost:8000/docs**

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend available at: **http://localhost:3000**

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, get JWT |
| GET | `/api/v1/auth/me` | Current user info |

### Collections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/collections` | Create collection |
| GET | `/api/v1/collections` | List collections |
| GET | `/api/v1/collections/:id` | Get collection + documents |
| DELETE | `/api/v1/collections/:id` | Delete collection + all data |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/documents/upload` | Upload & process document |
| GET | `/api/v1/documents/:id` | Get document status |
| GET | `/api/v1/documents/:id/chunks` | View document chunks |
| DELETE | `/api/v1/documents/:id` | Delete document |

### Query (RAG)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/query` | Ask a question (RAG) |
| GET | `/api/v1/query/conversations` | List conversations |
| GET | `/api/v1/query/conversations/:id` | Get full conversation |
| DELETE | `/api/v1/query/conversations/:id` | Delete conversation |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness (DB, Ollama, ChromaDB) |
| GET | `/stats` | System statistics |

---

## How It Works

### Document Ingestion Pipeline

1. **Upload** — User uploads PDF/DOCX/TXT/MD to a collection
2. **Extract** — Text extracted using PyPDF/python-docx
3. **Chunk** — Text split into overlapping chunks (~500 tokens) preserving paragraph boundaries
4. **Embed** — Each chunk embedded using `nomic-embed-text` via Ollama
5. **Store** — Embeddings stored in ChromaDB; metadata in MongoDB

### Query Pipeline

1. **Question** — User asks a natural language question
2. **Embed** — Question converted to embedding vector
3. **Search** — Cosine similarity search across ChromaDB collections
4. **Retrieve** — Top-K most relevant chunks returned with scores
5. **Generate** — LLM receives context chunks + question, generates answer
6. **Cite** — Response includes source document names, chunk indices, and relevance scores

### Multi-turn Conversations

- Each Q&A is saved to a conversation with auto-generated titles
- Follow-up questions include conversation history for context
- Conversations are scoped per user

---

## Project Structure

```
rag-knowledge-base/
├── backend/
│   ├── main.py                          # FastAPI entry point
│   ├── requirements.txt                 # Python dependencies
│   ├── env.example                      # Environment template
│   ├── config/
│   │   └── settings.py                  # Pydantic settings
│   ├── database/
│   │   └── mongodb.py                   # MongoDB connection
│   ├── auth/
│   │   └── security.py                  # JWT, password hashing
│   ├── models/
│   │   ├── user.py                      # User schemas
│   │   ├── document.py                  # Document/Collection schemas
│   │   └── query.py                     # Query/Conversation schemas
│   ├── services/
│   │   ├── document_processor.py        # Text extraction & chunking
│   │   ├── embedding_service.py         # Ollama embedding generation
│   │   ├── vector_store.py              # ChromaDB operations
│   │   ├── llm_service.py              # LLM answer generation
│   │   ├── ingestion_service.py         # Full ingestion pipeline
│   │   └── rag_engine.py               # Full RAG query pipeline
│   └── api/routes/
│       ├── auth_routes.py
│       ├── collection_routes.py
│       ├── document_routes.py
│       ├── query_routes.py
│       └── health_routes.py
│
└── frontend/
    ├── package.json
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── layout.tsx               # Root layout + AuthProvider
        │   ├── page.tsx                 # Main app (router)
        │   └── globals.css              # Tailwind + custom styles
        ├── components/
        │   ├── AuthPage.tsx             # Login/Register
        │   ├── Sidebar.tsx              # Navigation + collections
        │   ├── Dashboard.tsx            # Stats + system status
        │   ├── ChatView.tsx             # RAG Q&A chat interface
        │   └── CollectionView.tsx       # Document upload + management
        ├── context/
        │   └── AuthContext.tsx           # Auth state management
        └── lib/
            ├── api.ts                   # API client
            └── utils.ts                 # Helpers
```

---

## Key Features

- **Multi-format ingestion** — PDF, DOCX, TXT, Markdown
- **Semantic chunking** — Paragraph-aware splitting with configurable overlap
- **Hybrid AI providers** — Ollama (local/free) or Groq (cloud/fast)
- **Multi-collection search** — Query across all or selected document collections
- **Source citations** — Every answer includes document name, chunk index, relevance score
- **Conversational memory** — Multi-turn Q&A with conversation history
- **Real-time status** — Document processing status with polling
- **System health dashboard** — MongoDB, Ollama, ChromaDB status at a glance
- **Multi-tenant auth** — JWT-based, users only see their own data
- **Background processing** — Documents processed asynchronously via FastAPI BackgroundTasks

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `ollama` | `ollama` (local) or `groq` (cloud) |
| `OLLAMA_MODEL` | `llama3.2:latest` | LLM model for answer generation |
| `OLLAMA_EMBED_MODEL` | `nomic-embed-text:latest` | Embedding model |
| `CHUNK_SIZE` | `500` | Target chunk size in characters |
| `CHUNK_OVERLAP` | `50` | Overlap between consecutive chunks (words) |
| `MAX_UPLOAD_SIZE_MB` | `50` | Maximum file upload size |

---

## Troubleshooting

**"Ollama connection refused"**
- Ensure Ollama is running: `ollama serve`
- Check the URL in `.env` matches (default: `http://localhost:11434`)

**Slow embedding generation**
- Embedding runs sequentially per chunk. Large documents may take a few minutes on CPU.
- For faster processing, use a GPU-enabled machine.

**MongoDB connection errors**
- Verify MongoDB is running locally or your Atlas URI is correct
- Check IP whitelist for Atlas

**No results from queries**
- Ensure documents have `status: ready` (check via collection view or API)
- Try broader questions or lower `top_k`

---

## License

MIT
