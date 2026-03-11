-- ============================================================
-- GradeForge: FIX RLS INFINITE RECURSION
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- The issue was caused by the "Admin View Users" and "Admin Update Users" policies,
-- which query the `users` table to check the current user's role while evaluating 
-- access for the `users` table, creating an infinite loop.

-- 1. Drop existing policies on users table
DROP POLICY IF EXISTS "View Own Profile" ON public.users;
DROP POLICY IF EXISTS "View University Peers" ON public.users;
DROP POLICY IF EXISTS "Self Update" ON public.users;
DROP POLICY IF EXISTS "Admin View Users" ON public.users;
DROP POLICY IF EXISTS "Admin Update Users" ON public.users;
DROP POLICY IF EXISTS "View Users" ON public.users;
DROP POLICY IF EXISTS "Update Users" ON public.users;

-- 2. Create optimized non-recursive policies using current_setting or a secure function
-- Approach: Instead of a SELECT on public.users, we use a Security Definer function
-- to safely fetch the user's role and university_id without triggering RLS policies.

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_university(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT university_id FROM public.users WHERE id = user_id;
$$;

-- 3. Apply the fixed policies
-- Students and moderators can see peers in their university. Admins can see everyone.
CREATE POLICY "View Users" ON public.users FOR SELECT TO authenticated USING (
    id = auth.uid() OR -- Can see self
    public.get_user_role(auth.uid()) IN ('admin', 'moderator') OR -- Admins/Mods see everyone
    university_id = public.get_user_university(auth.uid()) -- Students see their university peers
);

-- Only admins can update other users (to change roles), users can update themselves
CREATE POLICY "Update Users" ON public.users FOR UPDATE TO authenticated USING (
    id = auth.uid() OR 
    public.get_user_role(auth.uid()) = 'admin'
);

-- 4. Fix Materials recursive policies just in case
-- Drop existing
DROP POLICY IF EXISTS "View University Materials" ON public.materials;
DROP POLICY IF EXISTS "Manage Own Materials" ON public.materials;
DROP POLICY IF EXISTS "View Materials" ON public.materials;
DROP POLICY IF EXISTS "Upload Materials" ON public.materials;
DROP POLICY IF EXISTS "Update Own Materials" ON public.materials;
DROP POLICY IF EXISTS "Moderator Update Materials" ON public.materials;
DROP POLICY IF EXISTS "Delete Own Materials" ON public.materials;
DROP POLICY IF EXISTS "Moderator Delete Materials" ON public.materials;
DROP POLICY IF EXISTS "Manage Materials" ON public.materials;
DROP POLICY IF EXISTS "Delete Materials" ON public.materials;

-- Recreation using the secure functions
CREATE POLICY "View Materials" ON public.materials FOR SELECT TO authenticated USING (
    uploader_id = auth.uid() OR 
    public.get_user_role(auth.uid()) IN ('admin', 'moderator') OR 
    (status = 'approved' AND EXISTS (
        SELECT 1 FROM public.subjects s
        JOIN public.departments d ON d.id = s.department_id
        WHERE s.id = public.materials.subject_id AND d.university_id = public.get_user_university(auth.uid())
    ))
);

CREATE POLICY "Upload Materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Manage Materials" ON public.materials FOR UPDATE TO authenticated USING (
    (uploader_id = auth.uid() AND status IN ('pending', 'rejected')) OR
    public.get_user_role(auth.uid()) IN ('admin', 'moderator')
);

CREATE POLICY "Delete Materials" ON public.materials FOR DELETE TO authenticated USING (
    uploader_id = auth.uid() OR
    public.get_user_role(auth.uid()) IN ('admin', 'moderator')
);

-- Done!
