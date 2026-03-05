import httpx
import json
import re
from typing import List, Optional, Dict
from config import settings


CHATBOT_SYSTEM_PROMPT = """You are a friendly and helpful AI knowledge base assistant. You can:

1. Have casual conversations — greetings, small talk, and general questions.
2. Answer questions from uploaded documents using provided context.

When context documents are provided and relevant to the question:
- Answer using the provided context and cite your sources (document name, chunk number).
- Be concise but thorough. If multiple sources differ, mention all perspectives.
- Never make up information that isn't in the context.

When NO context is provided (casual conversation, greetings, general questions):
- Respond naturally and conversationally.
- You can introduce yourself, explain your capabilities, and be friendly.
- If the user asks a knowledge question but no documents are uploaded, suggest they upload documents first.

Your name is RAG Assistant. You help users explore and query their uploaded knowledge base documents."""

CONVERSATION_SYSTEM_PROMPT = """You are a friendly AI knowledge base assistant in an ongoing conversation. You can have casual conversation AND answer questions from uploaded documents. When context documents are provided, use them to answer and cite sources. When no context is relevant, respond naturally. Use conversation history for continuity."""

# Patterns that indicate casual/non-document queries
CASUAL_PATTERNS = [
    r'^(hi|hello|hey|howdy|greetings|good\s*(morning|afternoon|evening|day)|sup|yo|what\'?s\s*up)[\s!?.]*$',
    r'^(how\s*are\s*you|how\'?s\s*it\s*going|what\s*can\s*you\s*do|who\s*are\s*you|help|thanks|thank\s*you|bye|goodbye|see\s*ya)[\s!?.]*$',
    r'^(tell\s*me\s*about\s*yourself|what\s*are\s*you|introduce\s*yourself)[\s!?.]*$',
]


def is_casual_query(question: str) -> bool:
    """Detect if a query is casual conversation vs a document question."""
    q = question.strip().lower()
    for pattern in CASUAL_PATTERNS:
        if re.match(pattern, q, re.IGNORECASE):
            return True
    # Very short queries with no real substance are likely greetings
    if len(q.split()) <= 2 and not any(c.isdigit() for c in q):
        return True
    return False


def _format_context(chunks: List[Dict]) -> str:
    """Format retrieved chunks into a context string for the LLM."""
    if not chunks:
        return "No relevant documents found."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        doc_name = chunk.get("metadata", {}).get("document_name", "Unknown")
        chunk_idx = chunk.get("metadata", {}).get("chunk_index", "?")
        score = 1 - chunk.get("distance", 0)  # Convert distance to similarity
        context_parts.append(
            f"[Source {i}: {doc_name} (chunk {chunk_idx}, relevance: {score:.2f})]\n"
            f"{chunk['document']}\n"
        )
    return "\n---\n".join(context_parts)


def _format_conversation_history(messages: List[Dict]) -> List[Dict]:
    """Format conversation history for the LLM."""
    formatted = []
    for msg in messages[-6:]:  # Keep last 6 messages for context window
        formatted.append({
            "role": msg["role"],
            "content": msg["content"],
        })
    return formatted


def _build_messages(
    question: str,
    context_chunks: List[Dict],
    conversation_history: Optional[List[Dict]] = None,
    casual: bool = False,
) -> List[Dict]:
    """Build the message list for the LLM."""
    messages = []

    if conversation_history:
        messages.append({"role": "system", "content": CONVERSATION_SYSTEM_PROMPT})
        messages.extend(_format_conversation_history(conversation_history))
    else:
        messages.append({"role": "system", "content": CHATBOT_SYSTEM_PROMPT})

    if casual or not context_chunks:
        messages.append({"role": "user", "content": question})
    else:
        context = _format_context(context_chunks)
        user_message = f"""Context from knowledge base:

{context}

Question: {question}

Please provide a detailed answer based on the context above, citing your sources."""
        messages.append({"role": "user", "content": user_message})

    return messages


async def generate_answer_ollama(
    question: str,
    context_chunks: List[Dict],
    conversation_history: Optional[List[Dict]] = None,
    casual: bool = False,
) -> str:
    """Generate an answer using Ollama."""
    messages = _build_messages(question, context_chunks, conversation_history, casual)

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{settings.OLLAMA_BASE_URL}/api/chat",
            json={
                "model": settings.OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.7 if casual else 0.3,
                    "top_p": 0.9,
                },
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"]


async def generate_answer_groq(
    question: str,
    context_chunks: List[Dict],
    conversation_history: Optional[List[Dict]] = None,
    casual: bool = False,
) -> str:
    """Generate an answer using Groq."""
    messages = _build_messages(question, context_chunks, conversation_history, casual)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.GROQ_MODEL,
                "messages": messages,
                "temperature": 0.7 if casual else 0.3,
                "top_p": 0.9,
                "max_tokens": 2048,
            },
        )
        if response.status_code != 200:
            error_body = response.text
            print(f"[Groq] Error {response.status_code}: {error_body}")
            response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def generate_answer(
    question: str,
    context_chunks: List[Dict],
    conversation_history: Optional[List[Dict]] = None,
    casual: bool = False,
) -> str:
    """Generate an answer using the configured AI provider."""
    if settings.AI_PROVIDER == "groq" and settings.GROQ_API_KEY:
        return await generate_answer_groq(question, context_chunks, conversation_history, casual)
    return await generate_answer_ollama(question, context_chunks, conversation_history, casual)


async def generate_conversation_title(question: str, answer: str) -> str:
    """Generate a short title for a conversation based on the first Q&A."""
    prompt = f"Generate a concise title (max 6 words) for a conversation that starts with this question: '{question}'. Reply with ONLY the title, no quotes or extra text."

    try:
        if settings.AI_PROVIDER == "groq" and settings.GROQ_API_KEY:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.5,
                        "max_tokens": 20,
                    },
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"].strip()
        else:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/chat",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "stream": False,
                        "options": {"temperature": 0.5},
                    },
                )
                response.raise_for_status()
                return response.json()["message"]["content"].strip()
    except Exception:
        # Fallback: use first few words of the question
        words = question.split()[:5]
        return " ".join(words) + ("..." if len(question.split()) > 5 else "")
