-- Create marks_components table for configurable assessment types
CREATE TABLE IF NOT EXISTS marks_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    component_type TEXT NOT NULL,
    max_marks DECIMAL(5, 2) NOT NULL,
    weight DECIMAL(3, 1) NOT NULL,
    obtained_marks DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marks_subjects table for tracking subject-level marks
CREATE TABLE IF NOT EXISTS marks_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    total_obtained DECIMAL(5, 2),
    total_max DECIMAL(5, 2),
    percentage DECIMAL(5, 2),
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE marks_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks_subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marks_components
CREATE POLICY "Users can view their own marks components" ON marks_components
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own marks components" ON marks_components
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marks components" ON marks_components
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marks components" ON marks_components
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for marks_subjects
CREATE POLICY "Users can view their own marks subjects" ON marks_subjects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own marks subjects" ON marks_subjects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marks subjects" ON marks_subjects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marks subjects" ON marks_subjects
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_marks_components_user_id ON marks_components(user_id);
CREATE INDEX idx_marks_components_subject ON marks_components(subject_name);
CREATE INDEX idx_marks_subjects_user_id ON marks_subjects(user_id);
CREATE INDEX idx_marks_subjects_subject ON marks_subjects(subject_name);
