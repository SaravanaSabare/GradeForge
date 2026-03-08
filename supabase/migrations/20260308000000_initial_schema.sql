-- GradeForge Production PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. UNIVERSITIES
-- ==========================================
CREATE TABLE public.universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    campuses TEXT[] DEFAULT '{}', -- Array of campus names
    grading_system TEXT NOT NULL DEFAULT '10-point' -- e.g., '10-point', '4-point'
);

-- ==========================================
-- 2. DEPARTMENTS
-- ==========================================
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- Index for fast lookup of departments by university
CREATE INDEX idx_departments_university_id ON public.departments(university_id);

-- ==========================================
-- 3. USERS (Extends Supabase Auth)
-- ==========================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    year INTEGER CHECK (year >= 1 AND year <= 6),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for user filtering and lookups
CREATE INDEX idx_users_university_id ON public.users(university_id);
CREATE INDEX idx_users_department_id ON public.users(department_id);

-- Trigger to sync user on auth sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, university_id, department_id, year)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data->>'name',
    (new.raw_user_meta_data->>'university_id')::UUID,
    (new.raw_user_meta_data->>'department_id')::UUID,
    (new.raw_user_meta_data->>'year')::INTEGER
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 4. SUBJECTS
-- ==========================================
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
    credits NUMERIC(3,1) NOT NULL CHECK (credits >= 0),
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    UNIQUE(department_id, subject_code)
);

-- Indexes for subject lookups
CREATE INDEX idx_subjects_department_id ON public.subjects(department_id);
CREATE INDEX idx_subjects_semester ON public.subjects(semester);

-- ==========================================
-- 5. GRADES
-- ==========================================
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    grade TEXT NOT NULL,          -- e.g., 'O', 'A+', 'A'
    grade_points NUMERIC(4,2) NOT NULL, -- e.g., 10.0, 9.0
    UNIQUE(user_id, subject_id)
);

-- Indexes for calculating CGPA and retrieving user grades efficiently
CREATE INDEX idx_grades_user_id ON public.grades(user_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);

-- ==========================================
-- 6. MATERIALS
-- ==========================================
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL, -- Supabase storage path or external URL
    file_type TEXT,         -- e.g., 'pdf', 'docx', 'jpg'
    title TEXT NOT NULL,
    description TEXT,
    downloads INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0.0, -- Cached average rating
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for filtering materials by subject and uploader, plus sorting by popularity
CREATE INDEX idx_materials_subject_id ON public.materials(subject_id);
CREATE INDEX idx_materials_uploader_id ON public.materials(uploader_id);
CREATE INDEX idx_materials_created_downloads ON public.materials(created_at DESC, downloads DESC);

-- ==========================================
-- 7. RATINGS
-- ==========================================
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating_value INTEGER NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    UNIQUE(material_id, user_id)
);

-- Indexes for rating queries
CREATE INDEX idx_ratings_material_id ON public.ratings(material_id);
CREATE INDEX idx_ratings_user_id ON public.ratings(user_id);

-- Function and trigger to update average rating on materials table
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

CREATE TRIGGER trg_update_material_rating
AFTER INSERT OR UPDATE OR DELETE ON public.ratings
FOR EACH ROW EXECUTE PROCEDURE public.update_material_rating();

-- ==========================================
-- 8. DOWNLOADS
-- ==========================================
CREATE TABLE public.downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for download tracking
CREATE INDEX idx_downloads_material_id ON public.downloads(material_id);
CREATE INDEX idx_downloads_user_id ON public.downloads(user_id);
CREATE INDEX idx_downloads_downloaded_at ON public.downloads(downloaded_at);

-- Function and trigger to increment cached download count
CREATE OR REPLACE FUNCTION public.increment_material_downloads()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.materials
    SET downloads = downloads + 1
    WHERE id = NEW.material_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_downloads
AFTER INSERT ON public.downloads
FOR EACH ROW EXECUTE PROCEDURE public.increment_material_downloads();

-- ==========================================
-- 9. STUDY GROUPS
-- ==========================================
CREATE TABLE public.study_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for finding study groups by university, subject, or creator
CREATE INDEX idx_study_groups_university_id ON public.study_groups(university_id);
CREATE INDEX idx_study_groups_subject_id ON public.study_groups(subject_id);
CREATE INDEX idx_study_groups_created_by ON public.study_groups(created_by);

-- ==========================================
-- 10. MESSAGES (For Realtime Study Groups)
-- ==========================================
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes required for quickly fetching message histories for a group, sorted by time
CREATE INDEX idx_messages_group_id_created_at ON public.messages(group_id, created_at ASC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
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

-- 1. Universities & Departments: Read-only for authenticated users
CREATE POLICY "View Universities" ON public.universities FOR SELECT TO authenticated USING (true);
CREATE POLICY "View Departments" ON public.departments FOR SELECT TO authenticated USING (true);

-- 2. Subjects: Read-only for authenticated users
CREATE POLICY "View Subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

-- 3. Users: Can view users in their own university, update their own profile
CREATE POLICY "View University Peers" ON public.users FOR SELECT TO authenticated USING (
    university_id = (SELECT university_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Self Update" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 4. Grades: Strict isolation to self
CREATE POLICY "Own Grades Only" ON public.grades FOR ALL TO authenticated USING (user_id = auth.uid());

-- 5. Materials: Viewable by university, editable by uploader
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

-- 6. Ratings & Downloads: Viewable by anyone with Material access, insert/own only
CREATE POLICY "View Ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rate Materials" ON public.ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update Own Rating" ON public.ratings FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "View Downloads" ON public.downloads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Track Downloads" ON public.downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- 7. Study Groups: Viewable by university
CREATE POLICY "View University Groups" ON public.study_groups FOR SELECT TO authenticated USING (
    university_id = (SELECT university_id FROM public.users WHERE id = auth.uid())
);
CREATE POLICY "Create Groups" ON public.study_groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- 8. Messages: Viewable by group university, insertable by university
CREATE POLICY "View Group Messages" ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.study_groups sg
        JOIN public.users u ON u.university_id = sg.university_id
        WHERE sg.id = public.messages.group_id AND u.id = auth.uid()
    )
);
CREATE POLICY "Send Messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
