-- ============================================================
-- FIX: Infinite Recursion in RLS Policies
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- The problem: Several RLS policies query public.users in their USING clause,
-- which triggers RLS on public.users, which queries public.users again = infinite loop.
-- Fix: Create a SECURITY DEFINER function that bypasses RLS to get the current user's university_id.

-- Step 1: Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_university_id()
RETURNS UUID AS $$
  SELECT university_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop all problematic policies
DROP POLICY IF EXISTS "View Own Profile" ON public.users;
DROP POLICY IF EXISTS "View University Peers" ON public.users;
DROP POLICY IF EXISTS "View University Materials" ON public.materials;
DROP POLICY IF EXISTS "View University Groups" ON public.study_groups;
DROP POLICY IF EXISTS "View Group Messages" ON public.messages;

-- Step 3: Recreate policies using the helper function

-- Users: can see own profile + university peers (no recursion!)
CREATE POLICY "View Users" ON public.users FOR SELECT TO authenticated USING (
    auth.uid() = id OR university_id = public.get_my_university_id()
);

-- Materials: viewable by university members
CREATE POLICY "View University Materials" ON public.materials FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.subjects s
        JOIN public.departments d ON d.id = s.department_id
        WHERE s.id = public.materials.subject_id
          AND d.university_id = public.get_my_university_id()
    )
);

-- Study Groups: viewable by university members
CREATE POLICY "View University Groups" ON public.study_groups FOR SELECT TO authenticated USING (
    university_id = public.get_my_university_id()
);

-- Messages: viewable by university members (via group)
CREATE POLICY "View Group Messages" ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.study_groups sg
        WHERE sg.id = public.messages.group_id
          AND sg.university_id = public.get_my_university_id()
    )
);

-- Done! The recursion is fixed. 🎉
