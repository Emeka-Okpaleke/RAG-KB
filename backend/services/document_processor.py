import io
from typing import List, Tuple
from pypdf import PdfReader
from docx import Document as DocxDocument
from config import settings


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text.strip())
    return "\n\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = DocxDocument(io.BytesIO(file_bytes))
    text_parts = []
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            text_parts.append(paragraph.text.strip())
    return "\n\n".join(text_parts)


def extract_text_from_txt(file_bytes: bytes) -> str:
    return file_bytes.decode("utf-8", errors="replace")


def extract_text(file_bytes: bytes, file_type: str) -> str:
    extractors = {
        "pdf": extract_text_from_pdf,
        "docx": extract_text_from_docx,
        "txt": extract_text_from_txt,
        "md": extract_text_from_txt,
    }
    extractor = extractors.get(file_type)
    if not extractor:
        raise ValueError(f"Unsupported file type: {file_type}")
    return extractor(file_bytes)


def chunk_text(
    text: str,
    chunk_size: int = None,
    chunk_overlap: int = None,
) -> List[Tuple[str, int]]:
    """Split text into overlapping chunks. Returns list of (chunk_text, chunk_index)."""
    if chunk_size is None:
        chunk_size = settings.CHUNK_SIZE
    if chunk_overlap is None:
        chunk_overlap = settings.CHUNK_OVERLAP

    if not text or not text.strip():
        return []

    # Split by paragraphs first for natural boundaries
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    chunks = []
    current_chunk = ""
    chunk_index = 0

    for paragraph in paragraphs:
        # If adding this paragraph exceeds chunk size, save current and start new
        if current_chunk and len(current_chunk) + len(paragraph) + 2 > chunk_size:
            chunks.append((current_chunk.strip(), chunk_index))
            chunk_index += 1

            # Keep overlap from end of current chunk
            words = current_chunk.split()
            overlap_words = words[-chunk_overlap:] if len(words) > chunk_overlap else words
            current_chunk = " ".join(overlap_words) + "\n\n" + paragraph
        else:
            if current_chunk:
                current_chunk += "\n\n" + paragraph
            else:
                current_chunk = paragraph

    # Don't forget the last chunk
    if current_chunk.strip():
        chunks.append((current_chunk.strip(), chunk_index))

    # Handle case where a single paragraph is longer than chunk_size
    final_chunks = []
    for text_chunk, idx in chunks:
        if len(text_chunk) > chunk_size * 2:
            # Force split long chunks by sentences
            sentences = text_chunk.replace(". ", ".\n").split("\n")
            sub_chunk = ""
            sub_idx = idx
            for sentence in sentences:
                if sub_chunk and len(sub_chunk) + len(sentence) + 1 > chunk_size:
                    final_chunks.append((sub_chunk.strip(), sub_idx))
                    sub_idx = len(final_chunks)
                    sub_chunk = sentence
                else:
                    sub_chunk = sub_chunk + " " + sentence if sub_chunk else sentence
            if sub_chunk.strip():
                final_chunks.append((sub_chunk.strip(), len(final_chunks)))
        else:
            final_chunks.append((text_chunk, len(final_chunks)))

    # Re-index
    return [(text, i) for i, (text, _) in enumerate(final_chunks)]
