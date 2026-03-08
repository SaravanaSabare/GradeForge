-- ============================================================
-- CGPA Calculator: Add semester_grades table
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Simple table to store calculator grade rows per semester
CREATE TABLE IF NOT EXISTS public.semester_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
    subject_name TEXT NOT NULL,
    subject_code TEXT DEFAULT '',
    credits NUMERIC(3,1) NOT NULL CHECK (credits >= 0),
    grade TEXT NOT NULL,
    grade_points NUMERIC(4,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, semester, subject_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_semester_grades_user_id ON public.semester_grades(user_id);
CREATE INDEX IF NOT EXISTS idx_semester_grades_semester ON public.semester_grades(user_id, semester);

-- RLS
ALTER TABLE public.semester_grades ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own grades
CREATE POLICY "Own Semester Grades" ON public.semester_grades 
    FOR ALL TO authenticated 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Done! 🎉
