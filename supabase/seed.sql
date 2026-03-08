-- GradeForge Seed Data
-- Run this AFTER the initial migration has been applied

-- ==========================================
-- UNIVERSITIES
-- ==========================================
INSERT INTO public.universities (id, name, campuses, grading_system) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-111111111111', 'SRM Institute of Science and Technology', ARRAY['Kattankulathur', 'Ramapuram', 'Vadapalani', 'NCR Ghaziabad', 'Sikkim', 'Amaravati'], '10-point'),
  ('a1b2c3d4-e5f6-7890-abcd-222222222222', 'VIT University', ARRAY['Vellore', 'Chennai', 'Bhopal', 'AP'], '10-point')
ON CONFLICT DO NOTHING;

-- ==========================================
-- DEPARTMENTS (SRM)
-- ==========================================
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

-- ==========================================
-- DEPARTMENTS (VIT)
-- ==========================================
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
