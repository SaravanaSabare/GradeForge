-- ============================================================
-- GradeForge: ALTER MATERIALS TABLE (Switch Subject -> Year/Exam)
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add new columns
ALTER TABLE public.materials 
  ADD COLUMN IF NOT EXISTS year INTEGER CHECK (year >= 1 AND year <= 6),
  ADD COLUMN IF NOT EXISTS exam TEXT CHECK (exam IN ('CLA 1', 'CLA 2', 'University Exam', 'Other'));

-- 2. Drop the foreign key constraint and column for subject_id
-- We drop the policy depending on it first
DROP POLICY IF EXISTS "View Materials" ON public.materials;

ALTER TABLE public.materials DROP COLUMN IF EXISTS subject_id CASCADE;

-- 3. Recreate the View Materials policy without subject dependency
-- People can see materials if they are approved and from their university, 
-- or if they uploaded it, or if they are admin/mod
CREATE POLICY "View Materials" ON public.materials FOR SELECT TO authenticated USING (
    uploader_id = auth.uid() OR 
    public.get_user_role(auth.uid()) IN ('admin', 'moderator') OR 
    (status = 'approved' AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = public.materials.uploader_id AND u.university_id = public.get_user_university(auth.uid())
    ))
);
