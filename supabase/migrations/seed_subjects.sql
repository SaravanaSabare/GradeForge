-- ============================================================
-- GradeForge: SEED INITIAL SUBJECTS
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- This script inserts some sample subjects for the SRM CSE department
-- so that the "Select subject" dropdown works correctly in the Upload Modal.

-- Assuming 'd1d1d1d1-0001-0001-0001-000000000001' is SRM Computer Science and Engineering
INSERT INTO public.subjects (id, department_id, semester, credits, subject_code, subject_name) VALUES
  (uuid_generate_v4(), 'd1d1d1d1-0001-0001-0001-000000000001', 1, 4.0, 'CS101', 'Introduction to Programming'),
  (uuid_generate_v4(), 'd1d1d1d1-0001-0001-0001-000000000001', 2, 4.0, 'CS102', 'Data Structures and Algorithms'),
  (uuid_generate_v4(), 'd1d1d1d1-0001-0001-0001-000000000001', 3, 3.0, 'CS201', 'Database Management Systems'),
  (uuid_generate_v4(), 'd1d1d1d1-0001-0001-0001-000000000001', 3, 4.0, 'CS202', 'Object Oriented Programming'),
  (uuid_generate_v4(), 'd1d1d1d1-0001-0001-0001-000000000001', 4, 3.0, 'CS301', 'Operating Systems'),
  (uuid_generate_v4(), 'd1d1d1d1-0001-0001-0001-000000000001', 4, 3.5, 'CS302', 'Computer Networks')
ON CONFLICT DO NOTHING;

-- Assuming 'd2d2d2d2-0002-0002-0002-000000000001' is VIT Computer Science and Engineering
INSERT INTO public.subjects (id, department_id, semester, credits, subject_code, subject_name) VALUES
  (uuid_generate_v4(), 'd2d2d2d2-0002-0002-0002-000000000001', 1, 4.0, 'CSE1001', 'Problem Solving and Programming'),
  (uuid_generate_v4(), 'd2d2d2d2-0002-0002-0002-000000000001', 2, 4.0, 'CSE1002', 'Object Oriented Methodology'),
  (uuid_generate_v4(), 'd2d2d2d2-0002-0002-0002-000000000001', 3, 3.0, 'CSE2001', 'Computer Architecture and Organization'),
  (uuid_generate_v4(), 'd2d2d2d2-0002-0002-0002-000000000001', 3, 4.0, 'CSE2002', 'Theory of Computation and Compiler Design')
ON CONFLICT DO NOTHING;

-- Done!
