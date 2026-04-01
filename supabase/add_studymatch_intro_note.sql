-- ============================================================
-- StudyMatch: Add intro_note to connections table
-- Run in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE public.connections 
ADD COLUMN IF NOT EXISTS intro_note TEXT DEFAULT '';
