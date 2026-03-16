import { supabase } from './supabase';

export interface MarkComponent {
    id: string;
    subject_name: string;
    component_type: string;
    max_marks: number;
    weight: number;
    obtained_marks: number | null;
}

export interface SubjectMarks {
    id: string;
    subject_name: string;
    total_obtained: number;
    total_max: number;
    percentage: number;
    grade: string;
    components: MarkComponent[];
}

// Grade mapping for marks
const GRADE_MAPPING = [
    { min: 90, max: 100, grade: 'O' },
    { min: 80, max: 89, grade: 'A+' },
    { min: 70, max: 79, grade: 'A' },
    { min: 60, max: 69, grade: 'B+' },
    { min: 50, max: 59, grade: 'B' },
    { min: 40, max: 49, grade: 'C' },
    { min: 0, max: 39, grade: 'F' },
];

export function getGradeFromPercentage(percentage: number): string {
    for (const { min, max, grade } of GRADE_MAPPING) {
        if (percentage >= min && percentage <= max) {
            return grade;
        }
    }
    return 'F';
}

export function calculateWeightedMarks(components: MarkComponent[]): number {
    let totalWeightedMarks = 0;
    let totalWeight = 0;

    for (const component of components) {
        if (component.obtained_marks !== null) {
            const percentage = (component.obtained_marks / component.max_marks) * 100;
            totalWeightedMarks += (percentage * component.weight) / 100;
            totalWeight += component.weight;
        }
    }

    return totalWeight > 0 ? totalWeightedMarks : 0;
}

export function calculateSubjectTotal(components: MarkComponent[]): {
    totalObtained: number;
    totalMax: number;
    percentage: number;
} {
    let totalObtained = 0;
    let totalMax = 0;

    for (const component of components) {
        if (component.obtained_marks !== null) {
            totalObtained += component.obtained_marks;
        }
        totalMax += component.max_marks;
    }

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    return {
        totalObtained,
        totalMax,
        percentage: Math.round(percentage * 100) / 100,
    };
}

export async function fetchMarksComponents(userId: string, subject: string): Promise<MarkComponent[]> {
    const { data, error } = await supabase
        .from('marks_components')
        .select('*')
        .eq('user_id', userId)
        .eq('subject_name', subject)
        .order('created_at');

    if (error) {
        console.error('Error fetching marks components:', error);
        return [];
    }

    return data || [];
}

export async function fetchAllSubjectsMarks(userId: string): Promise<SubjectMarks[]> {
    const { data, error } = await supabase
        .from('marks_components')
        .select('*')
        .eq('user_id', userId)
        .order('subject_name');

    if (error) {
        console.error('Error fetching all marks:', error);
        return [];
    }

    const groupedBySubject: Record<string, MarkComponent[]> = {};
    data?.forEach((component: any) => {
        if (!groupedBySubject[component.subject_name]) {
            groupedBySubject[component.subject_name] = [];
        }
        groupedBySubject[component.subject_name].push(component);
    });

    return Object.entries(groupedBySubject).map(([subject, components]) => {
        const { totalObtained, totalMax, percentage } = calculateSubjectTotal(components as MarkComponent[]);
        return {
            id: `${subject}-${Date.now()}`,
            subject_name: subject,
            total_obtained: totalObtained,
            total_max: totalMax,
            percentage,
            grade: getGradeFromPercentage(percentage),
            components: components as MarkComponent[],
        };
    });
}

export async function addMarkComponent(
    userId: string,
    subject: string,
    componentType: string,
    maxMarks: number,
    weight: number,
    obtainedMarks: number | null
): Promise<MarkComponent | null> {
    const { data, error } = await supabase
        .from('marks_components')
        .insert([
            {
                user_id: userId,
                subject_name: subject,
                component_type: componentType,
                max_marks: maxMarks,
                weight: weight,
                obtained_marks: obtainedMarks,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Error adding mark component:', error);
        return null;
    }

    return data || null;
}

export async function updateMarkComponent(
    componentId: string,
    updates: Partial<MarkComponent>
): Promise<MarkComponent | null> {
    const { data, error } = await supabase
        .from('marks_components')
        .update(updates)
        .eq('id', componentId)
        .select()
        .single();

    if (error) {
        console.error('Error updating mark component:', error);
        return null;
    }

    return data || null;
}

export async function deleteMarkComponent(componentId: string): Promise<boolean> {
    const { error } = await supabase
        .from('marks_components')
        .delete()
        .eq('id', componentId);

    if (error) {
        console.error('Error deleting mark component:', error);
        return false;
    }

    return true;
}
