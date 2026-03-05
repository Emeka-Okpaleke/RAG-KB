# Deployment Guide — RAG Knowledge Base

Step-by-step guide to deploy the RAG Knowledge Base as a portfolio project. The recommended stack is:

| Component | Service | Free Tier |
|-----------|---------|-----------|
| **Frontend** | Vercel | Yes |
| **Backend** | Render | Yes |
| **Database** | MongoDB Atlas | Yes (512MB) |
| **LLM** | Groq Cloud | Yes (rate-limited) |
| **Embeddings** | Hugging Face / Ollama on Render | Yes |
| **Vector Store** | ChromaDB (persistent on Render disk) | Yes |

---

## Table of Contents

1. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
2. [Groq API Key](#2-groq-api-key)
3. [Deploy Backend to Render](#3-deploy-backend-to-render)
4. [Deploy Frontend to Vercel](#4-deploy-frontend-to-vercel)
5. [Post-Deployment Configuration](#5-post-deployment-configuration)
6. [Rate Limiting & Abuse Prevention](#6-rate-limiting--abuse-prevention)
7. [Portfolio Tips](#7-portfolio-tips)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. MongoDB Atlas Setup

MongoDB Atlas provides a free 512MB cluster — more than enough for a portfolio demo.

### Steps

1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.

2. **Create a free cluster:**
   - Click "Build a Database"
   - Select **M0 Free** tier
   - Choose a cloud provider & region close to your Render deployment (e.g., AWS us-east-1)
   - Name your cluster (e.g., `rag-kb-cluster`)

3. **Create a database user:**
   - Go to **Database Access** → Add New Database User
   - Choose password authentication
   - Username: `rag_admin` (or your choice)
   - Generate a strong password — **save this**
   - Role: "Read and write to any database"

4. **Whitelist all IPs (for Render):**
   - Go to **Network Access** → Add IP Address
   - Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - This is needed because Render uses dynamic IPs on the free tier

5. **Get your connection string:**
   - Go to **Database** → Click **Connect** on your cluster
   - Choose **"Connect your application"** → **Driver: Python, Version 3.12+**
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://rag_admin:<password>@rag-kb-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database user password
   - Add your database name: append `&appName=rag_knowledge_base` or set it via env var

---

## 2. Groq API Key

Groq provides free API access with generous rate limits — perfect for a portfolio demo.

### Steps

1. Go to [console.groq.com](https://console.groq.com/) and sign up.

2. Navigate to **API Keys** → **Create API Key**.

3. Copy the key (starts with `gsk_...`). **Save this securely.**

4. Free tier limits (as of 2024):
   - ~30 requests/minute for most models
   - ~14,400 requests/day
   - The rate limiter we added keeps you well within these limits

---

## 3. Deploy Backend to Render

Render is the easiest option for deploying Python backends with a free tier.

### 3.1 Prepare the Repository

Make sure your code is pushed to GitHub/GitLab:

```bash
cd rag-knowledge-base
git init
git add .
git commit -m "Initial commit: RAG Knowledge Base"
git remote add origin https://github.com/YOUR_USERNAME/rag-knowledge-base.git
git push -u origin main
```

### 3.2 Create a Render Account

1. Go to [render.com](https://render.com/) and sign up with GitHub.

### 3.3 Create a Web Service

1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `rag-knowledge-base-api` |
| **Region** | Choose closest to your MongoDB Atlas region |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### 3.4 Add Environment Variables

In the Render dashboard, go to your service → **Environment** → add these:

```
MONGODB_URI=mongodb+srv://rag_admin:YOUR_PASSWORD@rag-kb-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=rag_knowledge_base
JWT_SECRET=generate-a-long-random-string-here
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text:latest
CHROMA_PERSIST_DIR=/opt/render/project/src/chroma_data
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_QUERY_PER_MINUTE=3
RATE_LIMIT_QUERY_PER_DAY=50
DEBUG=false
```

> **Important:** Generate a real JWT secret. Run this in Python:
> ```python
> import secrets; print(secrets.token_hex(32))
> ```

### 3.5 Add a Disk (for ChromaDB persistence)

1. In your Render service → **Disks** → **Add Disk**
2. **Name:** `chroma-data`
3. **Mount Path:** `/opt/render/project/src/chroma_data`
4. **Size:** 1 GB (free tier)

### 3.6 Python Version (Important!)

The `runtime.txt` file in the backend directory pins Python to **3.11.9**. This is crucial because:
- Newer Python versions (3.13+) may not have pre-built wheels for packages like `pydantic-core`
- Without pre-built wheels, pip tries to compile from source, which requires Rust
- Render's filesystem is read-only for Rust/Cargo cache, causing build failures

If you see errors about `maturin`, `cargo`, or `pydantic-core` failing to build, ensure `runtime.txt` exists with `python-3.11.9`.

### 3.7 Embedding Model on Render (Important!)

Since Render's free tier doesn't support running Ollama, you have two options:

**Option A: Use a hosted embedding API (Recommended)**

Replace the Ollama embedding calls with Groq or OpenAI-compatible embeddings. For simplicity with the current setup, you can use a lightweight self-hosted approach.

**Option B: Use HuggingFace Inference API (Free)**

Update `services/embedding_service.py` on your deployment branch to call the HuggingFace API instead of Ollama. This is the easiest free option.

**Option C: Run Ollama on a separate cheap VPS**

Use a $5/month VPS (e.g., DigitalOcean, Hetzner) to host Ollama and point `OLLAMA_BASE_URL` to it.

> **For a portfolio demo, Option B is recommended.** You can keep Option A for local dev and use a deployment-specific embedding service.

### 3.7 Deploy

Click **Deploy** and wait for the build to complete. Your API will be available at:
```
https://rag-knowledge-base-api.onrender.com
```

> **Note:** Free Render services spin down after 15 minutes of inactivity. First request after idle may take 30-60 seconds.

---

## 4. Deploy Frontend to Vercel

Vercel is the natural choice for Next.js deployment — zero configuration.

### 4.1 Create a Vercel Account

1. Go to [vercel.com](https://vercel.com/) and sign up with GitHub.

### 4.2 Import Project

1. Click **"Add New..."** → **Project**
2. Import your GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | (leave default) |

### 4.3 Add Environment Variables

Add this environment variable in the Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://rag-knowledge-base-api.onrender.com
```

> Replace with your actual Render backend URL from step 3.7.

### 4.4 Deploy

Click **Deploy**. Vercel will build and deploy automatically. Your frontend will be at:
```
https://rag-knowledge-base.vercel.app
```

### 4.5 Update Backend CORS

After getting your Vercel URL, add it to the backend's allowed origins.

**Option A:** Update `main.py` and redeploy:
```python
allow_origins=[
    "http://localhost:3000",
    "https://your-app.vercel.app",  # Add your Vercel URL
],
```

**Option B:** Add a `CORS_ORIGINS` env var to Render and read it in `main.py` (more flexible).

---

## 5. Post-Deployment Configuration

### 5.1 Verify Everything Works

1. Open your Vercel frontend URL
2. Register a new account
3. Create a collection
4. Upload a small test document
5. Ask a question about the document
6. Try a casual greeting — "Hello!" should get a friendly response

### 5.2 Custom Domain (Optional)

**Vercel:**
- Settings → Domains → Add your domain
- Update DNS records as instructed

**Render:**
- Settings → Custom Domain → Add domain
- Update DNS accordingly

### 5.3 Pre-seed Demo Data

For your portfolio, pre-upload a few interesting documents so recruiters see the app in action immediately:
- Your resume/CV
- A technical blog post
- A project specification document

---

## 6. Rate Limiting & Abuse Prevention

The app includes built-in rate limiting designed for portfolio use:

### Current Protections

| Protection | Setting | Default |
|-----------|---------|---------|
| **General API rate limit** | `RATE_LIMIT_PER_MINUTE` | 60 req/min per IP |
| **AI query rate limit** | `RATE_LIMIT_QUERY_PER_MINUTE` | 5 queries/min per IP |
| **Daily AI query cap** | `RATE_LIMIT_QUERY_PER_DAY` | 100 queries/day per IP |
| **File upload limit** | `MAX_UPLOAD_SIZE_MB` | 50 MB |
| **JWT auth required** | All data endpoints | Enabled |

### Recommended Production Settings for Portfolio

For a deployed portfolio demo, tighten the limits:

```env
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_QUERY_PER_MINUTE=3
RATE_LIMIT_QUERY_PER_DAY=50
MAX_UPLOAD_SIZE_MB=10
```

This means:
- A recruiter can explore freely (30 general requests/min is plenty for UI navigation)
- They can ask up to 3 AI questions per minute (enough to see it work)
- 50 AI queries per day per IP (enough to be impressed, not enough to abuse)
- 10MB upload limit (keeps storage usage low)

### How the Rate Limiter Works

- **In-memory** — No Redis needed, works on free tier
- **Per-IP tracking** — Each visitor gets their own limits
- **Auto-cleanup** — Old entries are purged every 60 seconds
- **Transparent headers** — Responses include `X-RateLimit-Limit` and `X-RateLimit-Remaining`
- **Friendly messages** — Rate limit errors explain this is a portfolio demo
- **Skips health checks** — Monitoring endpoints are never rate-limited

### Additional Security Measures Already in Place

- **JWT authentication** — Users must register/login
- **User scoping** — Users only see their own data
- **File type validation** — Only PDF, DOCX, TXT, MD allowed
- **File size validation** — Configurable max upload size
- **CORS restriction** — Only your frontend domain can call the API

---

## 7. Portfolio Tips

### What Recruiters Look For

This project demonstrates:
- **Full-stack development** — Python backend + React frontend
- **AI/ML integration** — RAG pipeline, embeddings, LLM orchestration
- **System design** — Microservice-like architecture, async processing, vector databases
- **API design** — RESTful endpoints, JWT auth, proper error handling
- **Modern tooling** — FastAPI, Next.js, TailwindCSS, MongoDB, ChromaDB

### Make It Shine

1. **Pre-upload your resume** — Let recruiters ask questions about your experience
2. **Add a demo banner** — Show a notice explaining this is a portfolio demo
3. **Link to GitHub** — Make the repo public with a clean README
4. **Record a demo video** — 2-minute walkthrough showing upload → query → answer with citations
5. **Add to your portfolio site** — Link prominently

### Conversation Starters for Recruiters

The chatbot now handles casual conversation, so a recruiter can:
- Say "Hello" → Gets a friendly greeting
- Ask "What can you do?" → Explains capabilities
- Upload a doc and ask questions → Gets cited answers
- Have natural follow-up conversations

---

## 8. Troubleshooting

### Backend won't start on Render

- Check **Logs** in Render dashboard
- Verify all environment variables are set
- Make sure `MONGODB_URI` is correct and IP whitelist includes `0.0.0.0/0`

### Frontend can't reach backend

- Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- Check that your Vercel domain is in the backend's CORS `allow_origins`
- Render free tier spins down — first request may take 30-60s

### Groq returns 400/401 errors

- Verify `GROQ_API_KEY` is correct
- Check `GROQ_MODEL` is a valid model name (`llama-3.3-70b-versatile`)
- Ensure your Groq free tier hasn't been suspended

### Embeddings fail on Render

- Ollama won't run on Render's free tier
- Use HuggingFace Inference API or a separate VPS for embeddings
- See [Section 3.6](#36-embedding-model-on-render-important) for options

### Rate limit errors

- Default limits are generous for normal use
- If you hit limits during development, temporarily increase via env vars
- The daily limit resets after 24 hours

### Render service sleeps after 15 min

- This is normal for the free tier
- First request after sleep takes ~30-60 seconds
- Consider using a cron job / uptime monitor to ping `/health` every 14 minutes (e.g., [UptimeRobot](https://uptimerobot.com/) free tier)

---

## Quick Reference: All Environment Variables

### Backend (Render)

```env
# Required
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=rag_knowledge_base
JWT_SECRET=your-long-random-secret
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile

# Embeddings (configure based on your chosen approach)
OLLAMA_BASE_URL=http://your-ollama-server:11434
OLLAMA_EMBED_MODEL=nomic-embed-text:latest

# Storage
CHROMA_PERSIST_DIR=/opt/render/project/src/chroma_data

# Rate limiting
RATE_LIMIT_PER_MINUTE=30
RATE_LIMIT_QUERY_PER_MINUTE=3
RATE_LIMIT_QUERY_PER_DAY=50
MAX_UPLOAD_SIZE_MB=10

# Misc
DEBUG=false
```

### Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```
