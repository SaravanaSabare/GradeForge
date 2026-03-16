/**
 * Groq Vision API service — extracts grade data from screenshots
 * Uses Llama 4 Scout via Groq (free tier)
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ExtractedGrade {
    subject_name: string;
    subject_code: string;
    credits: number;
    grade: string;
}

/**
 * Converts a File (image) to base64 data URI
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Sends a screenshot to Groq Vision and extracts grade rows
 */
export async function extractGradesFromImage(file: File): Promise<ExtractedGrade[]> {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file.');
    }

    const dataUrl = await fileToBase64(file);

    const prompt = `You are a grade extraction assistant. Analyze this screenshot of a student's academic grade report.

Extract ALL subjects/courses visible in the image and return them as a JSON array.

Each item must have:
- "subject_name": Full name of the subject/course
- "subject_code": Subject/course code (e.g. "CS1001", "MA2001"). If not visible, use ""
- "credits": Number of credits (integer). If the subject has 0 credits, keep it as 0. Only default to 3 if credits are not visible at all
- "grade": Letter grade using this scale: O, A+, A, B+, B, C, F. Map any equivalent grades (e.g. S=O, E=F, AB=F, W=F)

IMPORTANT: Return ONLY the JSON array, no markdown, no explanation, no code blocks. Example:
[{"subject_name":"Data Structures","subject_code":"CS2001","credits":4,"grade":"A+"}]

If you cannot identify any grades in the image, return an empty array: []`;

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
                content: [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: dataUrl } },
                ],
            }],
            temperature: 0.1,
            max_tokens: 2048,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Groq API error:', errText);
        try {
            const errJson = JSON.parse(errText);
            const msg = errJson?.error?.message || errText;
            throw new Error(`Groq API: ${msg}`);
        } catch (e: any) {
            if (e.message.startsWith('Groq API:')) throw e;
            throw new Error(`Groq API error (${response.status}). Check console for details.`);
        }
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '[]';

    // Parse JSON from the response
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    try {
        const grades: ExtractedGrade[] = JSON.parse(cleaned);
        return grades.map(g => ({
            subject_name: String(g.subject_name || '').trim(),
            subject_code: String(g.subject_code || '').trim(),
            credits: Math.max(0, Math.min(10, Number(g.credits) ?? 3)),
            grade: validateGrade(String(g.grade || 'A').trim()),
        })).filter(g => g.subject_name.length > 0);
    } catch {
        console.error('Failed to parse Groq response:', cleaned);
        throw new Error('Could not extract grades from this image. Try a clearer screenshot.');
    }
}

const VALID_GRADES = new Set(['O', 'A+', 'A', 'B+', 'B', 'C', 'F']);

function validateGrade(grade: string): string {
    const upper = grade.toUpperCase();
    if (VALID_GRADES.has(upper)) return upper;
    if (upper === 'S') return 'O';
    if (upper === 'E' || upper === 'AB' || upper === 'W') return 'F';
    if (upper.startsWith('A')) return 'A';
    if (upper.startsWith('B')) return 'B';
    return 'A';
}

/**
 * Gets AI-powered study recommendations based on weak subjects
 */
export async function getStudyRecommendations(
    weakSubjects: { name: string; gpa: number }[],
    averageGpa: number,
    semesterCount: number
): Promise<string> {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key is not configured.');
    }

    if (weakSubjects.length === 0) {
        return "You're performing consistently well across all subjects! Keep maintaining your high standards and continue exploring advanced topics in your areas of interest.";
    }

    const subjectList = weakSubjects.map(s => `${s.name} (GPA: ${s.gpa.toFixed(2)})`).join(', ');

    const prompt = `You are an expert academic advisor. A student has the following weak subjects: ${subjectList}

Their overall average GPA is ${averageGpa.toFixed(2)} and they've completed ${semesterCount} semester(s).

Provide BRIEF, actionable study recommendations:
1. Identify the common reasons why these subjects might be challenging
2. Suggest 2-3 specific study strategies tailored to these subjects
3. Recommend time management approach for next semester
4. Suggest one resource type (book, video, practice problems, etc.) that would help most

Keep the response concise (max 150 words), practical, and encouraging. Format as a few short paragraphs.`;

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
            max_tokens: 512,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to get AI recommendations from Groq');
    }

    const data = await response.json();
    const recommendation = data?.choices?.[0]?.message?.content || 'Unable to generate recommendations at this time.';
    return recommendation.trim();
}
