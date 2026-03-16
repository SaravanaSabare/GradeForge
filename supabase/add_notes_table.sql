-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create note_questions table for AI-generated Q&A
CREATE TABLE IF NOT EXISTS note_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes
CREATE POLICY "Users can view their own notes" ON notes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes" ON notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for note_questions
CREATE POLICY "Users can view questions for their notes" ON note_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_questions.note_id AND notes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert questions for their notes" ON note_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM notes WHERE notes.id = note_questions.note_id AND notes.user_id = auth.uid()
        )
    );

-- Create indexes for performance
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_subject ON notes(subject_name);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_note_questions_note_id ON note_questions(note_id);
