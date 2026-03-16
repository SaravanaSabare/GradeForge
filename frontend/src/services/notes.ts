/**
 * AI-powered note processing using Groq Llama
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GeneratedQA {
    question: string;
    answer: string;
}

/**
 * Generate a concise summary of note content
 */
export async function generateNoteSummary(noteContent: string, subject: string): Promise<string> {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key is not configured.');
    }

    if (!noteContent || noteContent.length < 50) {
        return 'Note is too short to summarize.';
    }

    const prompt = `You are an expert note-taking assistant. Summarize the following note from ${subject} in 2-3 sentences, capturing the key concepts and main ideas.

Note:
${noteContent}

Provide ONLY the summary, no preamble.`;

    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{
                role: 'user',
                content: prompt,
            }],
            temperature: 0.7,
            max_tokens: 300,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate summary from Groq');
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || 'Unable to generate summary.';
}

/**
 * Generate study questions from note content
 */
export async function generateStudyQuestions(
    noteContent: string,
    noteTitle: string,
    subject: string,
    count: number = 5
): Promise<GeneratedQA[]> {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key is not configured.');
    }

    if (!noteContent || noteContent.length < 100) {
        return [];
    }

    const prompt = `You are an expert educator. Generate ${count} important study questions based on the following note from "${subject}" titled "${noteTitle}".

For each question, also provide a concise answer based on the note content.

Note:
${noteContent}

Return ONLY a JSON array with no markdown, no code blocks. Format exactly like this:
[
  {"question":"What is...?","answer":"..."},
  {"question":"How does...?","answer":"..."}
]`;

    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{
                role: 'user',
                content: prompt,
            }],
            temperature: 0.8,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate questions from Groq');
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '[]';

    try {
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to parse Q&A response:', e);
        return [];
    }
}

/**
 * Generate tags/keywords from note content
 */
export async function generateNoteTags(noteContent: string, noteTitle: string): Promise<string[]> {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key is not configured.');
    }

    const prompt = `Extract 3-5 key topic tags from this note titled "${noteTitle}":

${noteContent}

Return ONLY a JSON array of strings, no markdown, no explanation. Example: ["tag1","tag2","tag3"]`;

    const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{
                role: 'user',
                content: prompt,
            }],
            temperature: 0.5,
            max_tokens: 200,
        }),
    });

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '[]';

    try {
        let cleaned = text.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to parse tags:', e);
        return [];
    }
}
