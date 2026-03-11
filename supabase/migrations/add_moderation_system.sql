-- ============================================================
-- GradeForge: ADD MODERATION SYSTEM & STORAGE
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Update Users Table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'moderator', 'admin'));

-- Set existing users to 'student' role
UPDATE public.users SET role = 'student' WHERE role IS NULL;

-- 2. Update Materials Table
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Set existing materials to 'approved' so they don't disappear
UPDATE public.materials SET status = 'approved' WHERE status IS NULL;

-- 3. Create Storage Bucket for Materials
-- (Requires enabling Storage in Supabase if not already done)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public read access to materials
CREATE POLICY "Public Read Materials" ON storage.objects
FOR SELECT USING (bucket_id = 'materials');

-- Allow authenticated users to upload materials
CREATE POLICY "Authenticated Upload Materials" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'materials');

-- Allow users to delete their own uploads
CREATE POLICY "Users Delete Own Materials" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'materials' AND auth.uid() = owner);

-- 4. Update Row Level Security (RLS) Policies on Materials Table
-- Drop existing policies that conflict
DROP POLICY IF EXISTS "View University Materials" ON public.materials;
DROP POLICY IF EXISTS "Manage Own Materials" ON public.materials;
DROP POLICY IF EXISTS "Delete Own Materials" ON public.materials;

-- New SELECT Policy:
-- Students see APPROVED materials in their university, OR their OWN materials (any status).
-- Moderators/Admins see ALL materials in their university.
CREATE POLICY "View Materials" ON public.materials FOR SELECT TO authenticated USING (
    ( -- Condition 1: Uploader is me
      uploader_id = auth.uid()
    ) OR
    ( -- Condition 2: I am a moderator/admin in the same university
      EXISTS (
        SELECT 1 FROM public.users me
        JOIN public.subjects s ON s.id = public.materials.subject_id
        JOIN public.departments d ON d.id = s.department_id
        WHERE me.id = auth.uid() AND me.role IN ('moderator', 'admin') AND me.university_id = d.university_id
      )
    ) OR
    ( -- Condition 3: Status is approved and it's in my university
      status = 'approved' AND EXISTS (
        SELECT 1 FROM public.subjects s
        JOIN public.departments d ON d.id = s.department_id
        JOIN public.users me ON me.university_id = d.university_id
        WHERE s.id = public.materials.subject_id AND me.id = auth.uid()
      )
    )
);

-- Manage Own Materials: Can only update if pending or rejected (to prevent malicious changes after approval)
CREATE POLICY "Update Own Materials" ON public.materials FOR UPDATE TO authenticated USING (
    uploader_id = auth.uid() AND status IN ('pending', 'rejected')
);

-- Moderators can update ANY material in their university (to approve/reject them)
CREATE POLICY "Moderator Update Materials" ON public.materials FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users me
        JOIN public.subjects s ON s.id = public.materials.subject_id
        JOIN public.departments d ON d.id = s.department_id
        WHERE me.id = auth.uid() AND me.role IN ('moderator', 'admin') AND me.university_id = d.university_id
    )
);

-- Delete Own Materials
CREATE POLICY "Delete Own Materials" ON public.materials FOR DELETE TO authenticated USING (
    uploader_id = auth.uid()
);

-- Moderators can delete ANY material in their university
CREATE POLICY "Moderator Delete Materials" ON public.materials FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.users me
        JOIN public.subjects s ON s.id = public.materials.subject_id
        JOIN public.departments d ON d.id = s.department_id
        WHERE me.id = auth.uid() AND me.role IN ('moderator', 'admin') AND me.university_id = d.university_id
    )
);

-- Admins can view/update all users to promote to moderator
CREATE POLICY "Admin View Users" ON public.users FOR SELECT TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admin Update Users" ON public.users FOR UPDATE TO authenticated USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- Done!
