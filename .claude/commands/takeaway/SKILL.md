---
name: takeaway
description: Log a detailed learning breakdown to takeaways.md. Use when the user invokes /project:takeaway after something happened that they want to understand — a script ran, a deploy completed, a bug was fixed, a concept clicked. Reviews the current conversation context to reconstruct what happened, explains it step by step in plain language, and appends the entry to the journal. Appends only — never overwrites existing content.
---

# Takeaway Logging Skill

## Purpose

Maintain a learning journal that explains *what happened and why* in plain language. This is for a developer who is learning — entries should walk through the process step by step so they can re-read it later and fully understand what occurred. These entries double as interview prep, study notes, and debugging reference.

## How It Works

1. **Get the topic.** The user provides a topic as the argument (e.g., `/project:takeaway RAG ingestion pipeline`). If no argument is given, ask what the takeaway is about.

2. **Review conversation context.** Look back through the current conversation to find the relevant work that was done — commands that ran, code that was written, explanations that were given. This is the raw material for the entry.

3. **Get today's date.** Run `date +%Y-%m-%d` in the shell to get the current date. Always use this command — do not hardcode or guess the date.

4. **Write the entry.** Append a new entry to `takeaways.md` in the project root. If the file does not exist, create it with a `# Takeaways` header first.

   Use this exact format:

   ```markdown

   ---

   ### [TOPIC]
   **Date:** [YYYY-MM-DD]

   **What prompted this:** [1 sentence — what the user did or asked that led to this takeaway. E.g., "I ran the ingestion script and didn't understand what it did."]

   **Here's what happened, step by step:**

   1. **[Step name]**
   [Plain-language explanation of this step — what it did, why it matters, and how it connects to the next step. Use specific details from the actual session: real file names, real function names, real numbers. Don't be generic.]

   2. **[Step name]**
   [Continue for each meaningful step...]

   **The big picture:**
   [1-3 sentences tying it all together — what was accomplished, what it enables, why it matters in the context of the project.]

   **Still unclear:** [Optional — any open questions, gaps in understanding, or things that need more digging. Omit this field entirely if there's nothing unclear.]
   ```

   ### Writing guidelines

   - **Be specific, not generic.** Use real file names, real numbers, real function names from the session. "It processed 49 chunks across 4 files" is better than "it processed your files."
   - **Explain the *why*, not just the *what*.** Don't just say "it created embeddings" — say *why* embeddings exist and what they enable.
   - **Write for a future reader who forgot the context.** The entry should make sense on its own, weeks later.
   - **Use plain language.** If a technical term is used, briefly define it inline (e.g., "a 1,536-dimensional vector — a numerical representation that captures the meaning of that code snippet").
   - **Number the steps.** Chronological, numbered steps make complex processes easy to follow.
   - **Bold the step names.** Makes the entry scannable.

5. **Always append — never overwrite.** Use the Edit tool to append to the end of the file, or Write only if the file is brand new. Existing entries must never be modified or deleted.

6. **Confirm briefly.** Reply with a short confirmation like:

   > Added takeaway on "[topic]" to takeaways.md.

   Do NOT dump the full explanation back into the chat unless the user explicitly asks to see it. The journal is the artifact.

## Rules

- One takeaway per invocation.
- Entries can be as long as they need to be — thoroughness over brevity. A 10-step process gets 10 steps.
- The "Still unclear" field is optional. Include it when the user mentions confusion or open questions. If everything is resolved, leave it out.
- The file is LOCAL-ONLY and should be gitignored. Do not `git add` it or include it in commits.
- If `takeaways.md` is not yet in `.gitignore`, add it.
