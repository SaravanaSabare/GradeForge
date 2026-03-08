-- ============================================================
-- GradeForge: COMPLETE SETUP SCRIPT
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. UNIVERSITIES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    campuses TEXT[] DEFAULT '{}',
    grading_system TEXT NOT NULL DEFAULT '10-point'
);

-- ==========================================
-- 2. DEPARTMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_departments_university_id ON public.departments(university_id);

-- ==========================================
-- 3. USERS (Extends Supabase Auth)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    year INTEGER CHECK (year >= 1 AND year <= 6),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_university_id ON public.users(university_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users(department_id);

-- Trigger: auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, university_id, department_id, year)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    NULLIF(new.raw_user_meta_data->>'university_id', '')::UUID,
    NULLIF(new.raw_user_meta_data->>'department_id', '')::UUID,
    NULLIF(new.raw_user_meta_data->>'year', '')::INTEGER
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 4. SUBJECTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
    credits NUMERIC(3,1) NOT NULL CHECK (credits >= 0),
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    UNIQUE(department_id, subject_code)
);
CREATE INDEX IF NOT EXISTS idx_subjects_department_id ON public.subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON public.subjects(semester);

-- ==========================================
-- 5. GRADES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,
    grade_points NUMERIC(4,2) NOT NULL,
    UNIQUE(user_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_grades_user_id ON public.grades(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);

-- ==========================================
-- 6. MATERIALS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    title TEXT NOT NULL,
    description TEXT,
    downloads INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploader_id ON public.materials(uploader_id);

-- ==========================================
-- 7. RATINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating_value INTEGER NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    UNIQUE(material_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ratings_material_id ON public.ratings(material_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

-- Rating average trigger
CREATE OR REPLACE FUNCTION public.update_material_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.materials
        SET rating = (SELECT ROUND(AVG(rating_value)::NUMERIC, 2) FROM public.ratings WHERE material_id = NEW.material_id)
        WHERE id = NEW.material_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.materials
        SET rating = COALESCE((SELECT ROUND(AVG(rating_value)::NUMERIC, 2) FROM public.ratings WHERE material_id = OLD.material_id), 0.0)
        WHERE id = OLD.material_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_material_rating ON public.ratings;
CREATE TRIGGER trg_update_material_rating
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE PROCEDURE public.update_material_rating();

-- ==========================================
-- 8. DOWNLOADS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_downloads_material_id ON public.downloads(material_id);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON public.downloads(user_id);

-- Download count trigger
CREATE OR REPLACE FUNCTION public.increment_material_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.materials SET downloads = downloads + 1 WHERE id = NEW.material_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_downloads ON public.downloads;
CREATE TRIGGER trg_increment_downloads
AFTER INSERT ON public.downloads
FOR EACH ROW EXECUTE PROCEDURE public.increment_material_downloads();

-- ==========================================
-- 9. STUDY GROUPS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_study_groups_university_id ON public.study_groups(university_id);
CREATE INDEX IF NOT EXISTS idx_study_groups_subject_id ON public.study_groups(subject_id);

-- ==========================================
-- 10. MESSAGES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_group_id_created_at ON public.messages(group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Universities & Departments: PUBLIC read (needed for signup dropdown!)
CREATE POLICY "Public Read Universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Public Read Departments" ON public.departments FOR SELECT USING (true);

-- Subjects: authenticated read
CREATE POLICY "View Subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

-- Users: view university peers, update self
CREATE POLICY "View Own Profile" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "View University Peers" ON public.users FOR SELECT TO authenticated USING (
    university_id = (SELECT university_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Self Update" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Grades: self only
CREATE POLICY "Own Grades Only" ON public.grades FOR ALL TO authenticated USING (user_id = auth.uid());

-- Materials
CREATE POLICY "View University Materials" ON public.materials FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.subjects s
        JOIN public.departments d ON d.id = s.department_id
        JOIN public.users u ON u.university_id = d.university_id
        WHERE s.id = public.materials.subject_id AND u.id = auth.uid()
    )
);
CREATE POLICY "Upload Materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());
CREATE POLICY "Manage Own Materials" ON public.materials FOR UPDATE TO authenticated USING (uploader_id = auth.uid());
CREATE POLICY "Delete Own Materials" ON public.materials FOR DELETE TO authenticated USING (uploader_id = auth.uid());

-- Ratings & Downloads
CREATE POLICY "View Ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rate Materials" ON public.ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update Own Rating" ON public.ratings FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "View Downloads" ON public.downloads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Track Downloads" ON public.downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Study Groups
CREATE POLICY "View University Groups" ON public.study_groups FOR SELECT TO authenticated USING (
    university_id = (SELECT university_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Create Groups" ON public.study_groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Messages
CREATE POLICY "View Group Messages" ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.study_groups sg
        JOIN public.users u ON u.university_id = sg.university_id
        WHERE sg.id = public.messages.group_id AND u.id = auth.uid()
    )
);
CREATE POLICY "Send Messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- ==========================================
-- SEED DATA: Universities & Departments
-- ==========================================

INSERT INTO public.universities (id, name, campuses, grading_system) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'SRM Institute of Science and Technology', ARRAY['Kattankulathur', 'Ramapuram', 'Vadapalani', 'NCR Ghaziabad', 'Sikkim', 'Amaravati'], '10-point'),
  ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'VIT University', ARRAY['Vellore', 'Chennai', 'Bhopal', 'AP'], '10-point')
ON CONFLICT DO NOTHING;

-- SRM Departments
INSERT INTO public.departments (id, university_id, name) VALUES
  ('d1d1d1d1-0001-0001-0001-000000000001', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Computer Science and Engineering'),
  ('d1d1d1d1-0001-0001-0001-000000000002', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Electronics and Communication Engineering'),
  ('d1d1d1d1-0001-0001-0001-000000000003', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Mechanical Engineering'),
  ('d1d1d1d1-0001-0001-0001-000000000004', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Electrical and Electronics Engineering'),
  ('d1d1d1d1-0001-0001-0001-000000000005', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Information Technology'),
  ('d1d1d1d1-0001-0001-0001-000000000006', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Biotechnology'),
  ('d1d1d1d1-0001-0001-0001-000000000007', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Civil Engineering'),
  ('d1d1d1d1-0001-0001-0001-000000000008', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Artificial Intelligence and Data Science'),
  ('d1d1d1d1-0001-0001-0001-000000000009', 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'Computer Science and Business Systems')
ON CONFLICT DO NOTHING;

-- VIT Departments
INSERT INTO public.departments (id, university_id, name) VALUES
  ('d2d2d2d2-0002-0002-0002-000000000001', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Computer Science and Engineering'),
  ('d2d2d2d2-0002-0002-0002-000000000002', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Electronics and Communication Engineering'),
  ('d2d2d2d2-0002-0002-0002-000000000003', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Mechanical Engineering'),
  ('d2d2d2d2-0002-0002-0002-000000000004', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Electrical and Electronics Engineering'),
  ('d2d2d2d2-0002-0002-0002-000000000005', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Information Technology'),
  ('d2d2d2d2-0002-0002-0002-000000000006', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Biomedical Engineering'),
  ('d2d2d2d2-0002-0002-0002-000000000007', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Chemical Engineering'),
  ('d2d2d2d2-0002-0002-0002-000000000008', 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Artificial Intelligence and Machine Learning')
ON CONFLICT DO NOTHING;

-- Done! 🎉
