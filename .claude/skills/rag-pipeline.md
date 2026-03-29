---
name: rag-pipeline
description: Patterns and best practices for building RAG (Retrieval-Augmented Generation) pipelines. Use this skill when building ingestion scripts, embedding pipelines, vector database operations (especially Pinecone), chunking strategies, retrieval logic, or LLM answer generation from retrieved context. Also trigger when debugging RAG-specific issues like poor retrieval quality, embedding dimension mismatches, Pinecone upsert/query problems, irrelevant search results, or context window management. Covers the full flow from raw files to generated answers.
---

# RAG Pipeline Skill

## Architecture Overview

A RAG pipeline has two phases:

**Ingestion (offline, runs once or on update):**
Raw files → Chunking → Embedding → Vector DB storage

**Retrieval (online, runs per query):**
User question → Embed question → Vector similarity search → Assemble context → LLM generates answer

## Ingestion Pipeline

### Step 1: File Discovery

Recursively walk the codebase directory and collect files by extension.

```python
import os

def discover_files(root_dir: str, extensions: list[str]) -> list[str]:
    """Find all files matching the given extensions."""
    files = []
    for dirpath, _, filenames in os.walk(root_dir):
        for f in filenames:
            if any(f.endswith(ext) for ext in extensions):
                files.append(os.path.join(dirpath, f))
    return files
```

Common extension sets by language:
- COBOL: `.cob`, `.cbl`, `.CBL`, `.COB`, `.cpy`, `.CPY`
- C: `.c`, `.h`
- Fortran: `.f`, `.f90`, `.f95`, `.for`
- Python: `.py`
- JavaScript/TypeScript: `.js`, `.ts`, `.jsx`, `.tsx`

### Step 2: Chunking

The single most important decision in a RAG pipeline. Bad chunks = bad retrieval = bad answers, regardless of how good your LLM is.

**Principles:**
- Chunk at logical boundaries (functions, paragraphs, sections), not arbitrary character counts
- Each chunk should be independently meaningful — a reader should understand it without surrounding context
- Include enough context in metadata to locate the chunk in the original file
- Preserve overlap between adjacent chunks to avoid losing context at boundaries

**Language-specific chunking strategies:**

Different languages have different natural boundaries. Always prefer structural boundaries over arbitrary splits:

- **COBOL:** Chunk at the paragraph level (within PROCEDURE DIVISION). COBOL's rigid hierarchy — DIVISION → SECTION → PARAGRAPH — makes paragraphs a natural sweet spot.
- **Python:** Chunk at function/class level using AST parsing or regex for `def`/`class` boundaries.
- **JavaScript/TypeScript:** Chunk at function/class/module export boundaries.
- **C:** Chunk at function definitions, using `{` `}` brace matching.
- **Generic fallback:** Sliding window with overlap (e.g., 500 tokens with 50-token overlap).

**Example: A paragraph-level chunker for COBOL**

```python
import re

def chunk_cobol_file(filepath: str, content: str) -> list[dict]:
    """Split COBOL source into paragraph-level chunks with metadata."""
    lines = content.split('\n')
    chunks = []
    current_chunk_lines = []
    current_start_line = 1
    current_paragraph = "PREAMBLE"
    current_section = "UNKNOWN"
    current_division = "UNKNOWN"

    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        # Detect DIVISION
        if re.match(r'^[\w-]+\s+DIVISION', stripped, re.IGNORECASE):
            current_division = stripped.split()[0]

        # Detect SECTION
        if re.match(r'^[\w-]+\s+SECTION', stripped, re.IGNORECASE):
            current_section = stripped.split()[0]

        # Detect PARAGRAPH (a label followed by a period at start of line)
        # COBOL paragraphs start in Area A (columns 8-11)
        para_match = re.match(r'^[\w-]+\.\s*$', stripped)

        if para_match and current_chunk_lines:
            # Save the previous chunk
            chunk_text = '\n'.join(current_chunk_lines)
            if chunk_text.strip():
                chunks.append({
                    'text': chunk_text,
                    'file': filepath,
                    'start_line': current_start_line,
                    'end_line': i - 1,
                    'paragraph': current_paragraph,
                    'section': current_section,
                    'division': current_division,
                })
            current_chunk_lines = [line]
            current_start_line = i
            current_paragraph = stripped.rstrip('.')
        else:
            current_chunk_lines.append(line)

    # Don't forget the last chunk
    if current_chunk_lines:
        chunk_text = '\n'.join(current_chunk_lines)
        if chunk_text.strip():
            chunks.append({
                'text': chunk_text,
                'file': filepath,
                'start_line': current_start_line,
                'end_line': len(lines),
                'paragraph': current_paragraph,
                'section': current_section,
                'division': current_division,
            })

    return chunks
```

**Chunk size guidelines:**
- Too small (<100 tokens): loses context, embeddings become noisy
- Sweet spot (200-800 tokens): enough context for meaningful retrieval
- Too large (>1500 tokens): dilutes relevance, wastes context window space

If a chunk is too large, split it further. If too small, consider merging with neighbors.

### Step 3: Generate Embeddings

```python
from openai import OpenAI

client = OpenAI()  # Uses OPENAI_API_KEY from environment

def embed_texts(texts: list[str], model: str = "text-embedding-3-small") -> list[list[float]]:
    """Generate embeddings for a batch of texts."""
    # OpenAI supports batching up to 2048 texts per request
    response = client.embeddings.create(
        input=texts,
        model=model
    )
    return [item.embedding for item in response.data]
```

**Batch efficiently.** Don't embed one chunk at a time — batch them. OpenAI allows up to 2048 texts per API call. Process in batches of 100-500 for a good balance of speed and memory.

**Track costs.** Count tokens before embedding to estimate costs. For `text-embedding-3-small`, the cost is approximately $0.02 per 1M tokens.

### Step 4: Upsert to Pinecone

```python
from pinecone import Pinecone

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index("your-index-name")

def upsert_chunks(chunks: list[dict], embeddings: list[list[float]]):
    """Insert chunks with embeddings and metadata into Pinecone."""
    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"{chunk['file']}:{chunk['start_line']}",
            "values": embedding,
            "metadata": {
                "text": chunk["text"][:40000],  # Pinecone metadata limit
                "file": chunk["file"],
                "start_line": chunk["start_line"],
                "end_line": chunk["end_line"],
            }
        })

    # Upsert in batches of 100 (Pinecone recommendation)
    for i in range(0, len(vectors), 100):
        batch = vectors[i:i+100]
        index.upsert(vectors=batch)
```

**Critical: Pinecone metadata stores chunk text.** You need the original text in metadata so you can return it to the user and pass it to the LLM. Pinecone's metadata size limit is 40KB per vector.

**Index setup (do once in Pinecone dashboard or via API):**
- Dimensions: 1536 (for text-embedding-3-small)
- Metric: cosine
- Spec: serverless, aws, us-east-1 (free tier)

## Retrieval Pipeline

### Query Flow

```python
async def query_pipeline(question: str, top_k: int = 5) -> dict:
    """Full retrieval pipeline: embed → search → generate."""

    # 1. Embed the question with the SAME model used for ingestion
    query_embedding = embed_texts([question])[0]

    # 2. Search Pinecone
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )

    # 3. Assemble context from retrieved chunks
    context_parts = []
    sources = []
    for match in results.matches:
        meta = match.metadata
        context_parts.append(
            f"[File: {meta['file']}, Lines: {meta['start_line']}-{meta['end_line']}]\n{meta['text']}"
        )
        sources.append({
            "file": meta["file"],
            "start_line": meta["start_line"],
            "end_line": meta["end_line"],
            "score": match.score,
            "text": meta["text"],
        })

    context = "\n\n---\n\n".join(context_parts)

    # 4. Generate answer
    answer = await generate_answer(question, context)

    return {
        "answer": answer,
        "sources": sources,
    }
```

### Answer Generation Prompt

The prompt template is critical. It must instruct the LLM to ground answers in the retrieved context and cite sources.

```python
SYSTEM_PROMPT = """You are [YOUR_ASSISTANT_NAME], an expert assistant for understanding codebases.
You answer questions based ONLY on the provided code context.
If the context does not contain enough information to answer, say so clearly.
Always reference specific files and line numbers in your answers.
Format code references as: [filename:line_start-line_end]"""

async def generate_answer(question: str, context: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
        ],
        temperature=0.2,  # Low temperature for factual accuracy
    )
    return response.choices[0].message.content
```

## Common Failure Modes and Fixes

**Problem: Retrieval returns irrelevant chunks**
- Check that query embedding uses the SAME model as ingestion embeddings
- Check chunk quality — are chunks too large (diluted meaning) or too small (no context)?
- Try rephrasing the query or adding query expansion

**Problem: Embedding dimension mismatch**
- Pinecone index dimensions must match your embedding model exactly
- text-embedding-3-small = 1536 dimensions
- If you change models, you must delete and recreate the index

**Problem: Pinecone upsert succeeds but query returns nothing**
- Pinecone serverless indexes may take a few seconds to become queryable after upsert
- Add a short delay after bulk upsert before testing queries
- Verify upsert worked: `index.describe_index_stats()`

**Problem: LLM hallucinates despite good retrieval**
- Lower temperature (0.1-0.2)
- Add explicit "do not make up information" instruction to system prompt
- Include the retrieved code verbatim in the context so the LLM can quote directly
- Add a "if you don't know, say so" instruction

**Problem: Chunks are too large for context window**
- Calculate total tokens: (avg chunk tokens × top_k) + question + system prompt
- For GPT-4o-mini with 128K context, this is rarely an issue
- If needed, reduce top_k or truncate chunks
