/**
 * Gemini Vision API service — extracts grade data from screenshots
 * Uses Gemini 2.0 Flash (free tier: 15 RPM, 1500 req/day)
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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
        reader.onload = () => {
            const result = reader.result as string;
            // Strip the data:image/...;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Sends a screenshot to Gemini Vision and extracts grade rows
 */
export async function extractGradesFromImage(file: File): Promise<ExtractedGrade[]> {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured. Add VITE_GEMINI_API_KEY to your .env file.');
    }

    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/png';

    const prompt = `You are a grade extraction assistant. Analyze this screenshot of a student's academic grade report.

Extract ALL subjects/courses visible in the image and return them as a JSON array.

Each item must have:
- "subject_name": Full name of the subject/course
- "subject_code": Subject/course code (e.g. "CS1001", "MA2001"). If not visible, use ""
- "credits": Number of credits (integer). If not visible, default to 3
- "grade": Letter grade using this scale: O, A+, A, B+, B, C, F. Map any equivalent grades (e.g. S=O, E=F, AB=F, W=F)

IMPORTANT: Return ONLY the JSON array, no markdown, no explanation, no code blocks. Example:
[{"subject_name":"Data Structures","subject_code":"CS2001","credits":4,"grade":"A+"}]

If you cannot identify any grades in the image, return an empty array: []`;

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType,
                            data: base64,
                        },
                    },
                ],
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048,
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API error:', errText);
        try {
            const errJson = JSON.parse(errText);
            const msg = errJson?.error?.message || errText;
            throw new Error(`Gemini API: ${msg}`);
        } catch (e: any) {
            if (e.message.startsWith('Gemini API:')) throw e;
            throw new Error(`Gemini API error (${response.status}). Check console for details.`);
        }
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Parse JSON from the response (handle potential markdown code blocks)
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    try {
        const grades: ExtractedGrade[] = JSON.parse(cleaned);
        // Validate and sanitize
        return grades.map(g => ({
            subject_name: String(g.subject_name || '').trim(),
            subject_code: String(g.subject_code || '').trim(),
            credits: Math.max(1, Math.min(10, Number(g.credits) || 3)),
            grade: validateGrade(String(g.grade || 'A').trim()),
        })).filter(g => g.subject_name.length > 0);
    } catch {
        console.error('Failed to parse Gemini response:', cleaned);
        throw new Error('Could not extract grades from this image. Try a clearer screenshot.');
    }
}

const VALID_GRADES = new Set(['O', 'A+', 'A', 'B+', 'B', 'C', 'F']);

function validateGrade(grade: string): string {
    const upper = grade.toUpperCase();
    if (VALID_GRADES.has(upper)) return upper;
    // Common mappings
    if (upper === 'S') return 'O';
    if (upper === 'E' || upper === 'AB' || upper === 'W') return 'F';
    // Try closest match
    if (upper.startsWith('A')) return 'A';
    if (upper.startsWith('B')) return 'B';
    return 'A'; // Safe default
}
