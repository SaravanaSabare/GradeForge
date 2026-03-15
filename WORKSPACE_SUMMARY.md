# GradeForge - Complete Workspace Study

## Project Overview

**GradeForge** is a full-stack web application designed for engineering students in India (targeting universities like SRM, VIT, and 50+ others). It provides a comprehensive platform for CGPA calculation, study partner matching, and study material sharing.

**Repository**: GradeForge (owned by SaravanaSabare, master branch)  
**Current Date**: March 15, 2026  
**Tech Stack**: React 19.2 + TypeScript, Vite, Tailwind CSS 4.2, Supabase, PostgreSQL 17

---

## Project Structure

```
cgpa-calc/
├── frontend/                    # React + TypeScript + Vite application
│   ├── src/
│   │   ├── pages/              # Main page components
│   │   │   ├── Landing.tsx      # Public landing page
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx    # Email/OAuth login
│   │   │   │   ├── Signup.tsx   # Registration
│   │   │   │   └── CompleteProfile.tsx  # Post-signup profile setup
│   │   │   └── dashboard/
│   │   │       ├── Overview.tsx          # Dashboard stats & semester summary
│   │   │       ├── calculator/
│   │   │       │   ├── index.tsx         # CGPA Calculator (main feature)
│   │   │       │   └── ScreenshotImportModal.tsx  # Vision API for grade extraction
│   │   │       ├── materials/
│   │   │       │   └── index.tsx         # Study materials repository
│   │   │       ├── studymatch/
│   │   │       │   └── index.tsx         # Study partner matching (Tinder-like)
│   │   │       └── admin/
│   │   │           └── index.tsx         # Admin panel (moderation)
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardLayout.tsx   # Sidebar + navigation
│   │   │   └── materials/
│   │   │       └── UploadModal.tsx       # Upload material modal
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx           # Auth state management (Supabase)
│   │   ├── services/
│   │   │   ├── supabase.ts               # Supabase client initialization
│   │   │   └── gemini.ts                 # Groq Vision API for screenshot parsing
│   │   ├── utils/
│   │   │   └── cn.ts                     # Class name utility
│   │   ├── App.tsx                       # Route configuration + Protected/Auth routes
│   │   ├── main.tsx                      # React entry point
│   │   ├── index.css                     # Global styles
│   │   └── App.css                       # App-specific styles
│   ├── public/                  # Static assets
│   │   └── vite.svg
│   ├── package.json             # Dependencies & scripts
│   ├── vite.config.ts           # Vite + React + Tailwind config
│   ├── tsconfig.json            # TypeScript configuration
│   ├── eslint.config.js         # ESLint rules
│   ├── index.html               # HTML entry
│   └── vercel.json              # Vercel deployment config
│
└── supabase/                    # Database & migrations
    ├── config.toml              # Supabase local dev config (PostgreSQL 17)
    ├── setup.sql                # One-off schema setup script
    ├── seed.sql                 # Database seeding
    ├── migrations/
    │   ├── 20260308000000_initial_schema.sql    # Core tables
    │   ├── add_moderation_system.sql            # Admin moderation features
    │   ├── add_studymatch.sql                   # Connections & messaging
    │   ├── alter_materials_year_exam.sql        # Material schema updates
    │   ├── fix_rls_recursion.sql                # Row-level security fixes
    │   └── seed_subjects.sql                    # Pre-populate subjects
    └── [root migrations]
        ├── add_semester_grades.sql
        └── [other migration files]
```

---

## Core Features

### 1. **CGPA Calculator** (`/dashboard/calculator`)
- **Purpose**: Track and calculate GPA across multiple semesters
- **Key Features**:
  - Manual grade entry with subject code, name, credits, and letter grade
  - Real-time CGPA calculation using weighted average formula
  - **Screenshot Import**: Upload grade report screenshots → Groq Vision API extracts grades automatically
  - Multi-semester management (switch between semesters)
  - Target CGPA tracker (predict future GPA)
  - Save/sync grades to database

- **Tech Stack**: 
  - Frontend: React hooks (useState, useEffect)
  - Backend: Supabase `semester_grades` table
  - External: Groq Vision API (Llama 4 Scout) for image parsing

- **Grade Mapping**:
  ```
  O = 10, A+ = 9, A = 8, B+ = 7, B = 6, C = 5, F = 0
  ```

### 2. **Study Materials Portal** (`/dashboard/materials`)
- **Purpose**: Share and discover vetted study resources
- **Key Features**:
  - Browse approved materials by university
  - Upload personal materials (PDFs, docs, images, past papers)
  - Material status: Pending Review → Approved/Rejected
  - Rating system (1-5 stars with avg caching)
  - Download tracking
  - Search/filter by exam type, year
  - Admin moderation interface

- **Data Model**:
  - `materials` table: title, description, file_url, file_type, status, rejection_reason
  - `ratings` table: tracks user ratings (1 per user per material)
  - `downloads` table: tracks download events
  - Triggers auto-update avg rating and download counts

### 3. **StudyMatch** (`/dashboard/studymatch`)
- **Purpose**: Tinder-like matching for study partners
- **Key Features**:
  - Discover users from same university (filtered by CGPA/year)
  - Swipe-based matching (like/pass cards)
  - Accepted matches show connection list
  - Messaging between matched users (real-time or polling)
  - View match profiles with CGPA, department, year

- **Data Model**:
  - `connections` table: sender_id, receiver_id, status (pending/accepted/rejected)
  - `messages` table: sender_id, receiver_id, message, created_at
  - RPC function: `get_discover_users()` filters compatible students

### 4. **Dashboard Overview** (`/dashboard`)
- **Purpose**: At-a-glance academic metrics
- **Displays**:
  - Current CGPA (overall & by semester)
  - Total credits earned
  - Subject count
  - Semester breakdown (GPA per semester)
  - Trending stats

### 5. **Authentication**
- **Methods**:
  - Email/Password (Supabase Auth)
  - OAuth: Google & GitHub
  
- **Flow**:
  1. Signup → Create auth user
  2. Trigger `handle_new_user()` → Auto-create `public.users` profile
  3. Redirect to `/complete-profile` to select university/department/year
  4. Access to protected routes (`/dashboard/*`)

### 6. **Admin Panel** (`/dashboard/admin`)
- **Purpose**: Content moderation and system management
- **Access**: Users with `role = 'admin'` or `role = 'moderator'`
- **Functions**: Review pending materials, reject with reason, manage users

---

## Database Schema

### **Universities**
- `id` (UUID PK)
- `name` (text)
- `campuses` (text[])
- `grading_system` (text: '10-point', '4-point', etc.)

### **Departments**
- `id` (UUID PK)
- `university_id` (FK)
- `name` (text)

### **Users** (extends Supabase Auth)
- `id` (UUID PK, FK to auth.users)
- `name`, `email`, `university_id`, `department_id`, `year`
- `created_at` (timestamptz)
- **Trigger**: `on_auth_user_created` auto-creates profile

### **Subjects**
- `id` (UUID PK)
- `department_id` (FK)
- `semester` (int 1-12)
- `credits` (numeric 3.1)
- `subject_code`, `subject_name`
- **Unique**: (department_id, subject_code)

### **Grades**
- `id` (UUID PK)
- `user_id`, `subject_id` (FKs)
- `grade` (text), `grade_points` (numeric)
- **Unique**: (user_id, subject_id)

### **Semester Grades** (flattened view for efficiency)
- Stores pre-calculated grades with semester + grade_points
- Used for quick dashboard & calculator queries

### **Materials**
- `id`, `subject_id`, `uploader_id`
- `file_url`, `file_type`, `title`, `description`
- `status` ('pending', 'approved', 'rejected')
- `rejection_reason`, `downloads`, `rating`
- `created_at`, `year` (material year/exam info), `exam` (exam type)

### **Ratings**
- `id`, `material_id`, `user_id`, `rating_value` (1-5)
- **Unique**: (material_id, user_id)
- **Trigger**: `update_material_rating()` auto-updates material avg

### **Downloads**
- `id`, `material_id`, `user_id`, `downloaded_at`
- **Trigger**: `increment_material_downloads()` auto-increments counter

### **Study Groups**
- `id`, `university_id`, `subject_id`, `created_by`, `created_at`

### **Connections**
- `id`, `sender_id`, `receiver_id`, `status` ('pending', 'accepted', 'rejected')
- Used for StudyMatch feature

### **Messages**
- `id`, `sender_id`, `receiver_id`, `message`, `created_at`
- For StudyMatch in-app messaging

---

## Environment Variables

**Frontend** (`.env` in `/frontend`):
```
VITE_SUPABASE_URL=        # Supabase project URL
VITE_SUPABASE_ANON_KEY=   # Supabase anon public key
VITE_GROQ_API_KEY=        # Groq API key for Vision API
```

**Supabase Local Dev** (`/supabase/config.toml`):
```toml
project_id = "cgpa-calc"
[api]
  port = 54321
  schemas = ["public", "graphql_public"]
[db]
  port = 54322
  major_version = 17
  pool_mode = "transaction"
```

---

## Key Dependencies

### Frontend
- **React 19.2**: UI framework
- **React Router 7.13**: Client-side routing
- **Supabase JS 2.98**: Backend client
- **Tailwind CSS 4.2**: Styling
- **Vite 7.3**: Build tool & dev server
- **TypeScript 5.9**: Type safety
- **Lucide React 0.577**: Icon library
- **ESLint 9.39**: Linting

### Backend
- **Supabase**: PostgreSQL 17 backend, Auth, Storage
- **Groq Vision API**: Screenshot → grade extraction

---

## API Integrations

### 1. **Supabase Client** (`/frontend/src/services/supabase.ts`)
```typescript
const supabase = createClient(
  VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY
)
```

### 2. **Groq Vision API** (`/frontend/src/services/gemini.ts`)
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Model**: `meta-llama/llama-4-scout-17b-16e-instruct`
- **Input**: Base64-encoded image + prompt
- **Output**: JSON array of extracted grades
- **Error Handling**: Returns empty array if no grades detected

---

## Authentication Flow

1. **User Signup** → Email/Password or OAuth
2. **Auth Trigger** → `handle_new_user()` inserts into `public.users`
3. **Complete Profile** → Select university, department, year
4. **Protected Routes** → `<ProtectedRoute>` checks session + profile
5. **Dashboard** → Access calculator, materials, studymatch
6. **Admin Routes** → Check `role` field
7. **Logout** → `supabase.auth.signOut()`

---

## Styling Architecture

- **Global**: `index.css` (CSS variables for colors, typography)
- **Component**: Inline styles + CSS classes
- **Utilities**: `utils/cn.ts` (clsx wrapper for class merging)
- **Design System**:
  - Primary accent: `#7C5CFF` (purple)
  - Secondary: `#00E5FF` (cyan), `#FF4D9D` (pink)
  - Background: `#020617` (dark navy)
  - Text: `#f1f5f9` (light), `#64748b` (muted)
  - Gradients: Glass morphism + gradient borders

---

## Development Workflow

### Frontend Dev
```bash
cd frontend
npm install
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Supabase Local
```bash
supabase start       # Start local PostgreSQL + API
supabase migration list
supabase migration up
supabase db push     # Apply migrations
```

### Deployment
- **Frontend**: Vercel (auto-deploy from master)
- **Database**: Supabase Cloud
- **Config**: `vercel.json` in root

---

## Notable Patterns & Conventions

### Context API
- `AuthContext.tsx`: Manages session, user, profile, loading state
- `useAuth()` hook consumed throughout app

### Protected Routes
```tsx
<ProtectedRoute>
  <ComponentName />
</ProtectedRoute>
```
- Checks session exists
- Checks profile has university_id
- Redirects to login/complete-profile if needed

### Async Data Fetching
- Uses React hooks (useState, useEffect)
- Supabase `.select()`, `.eq()`, `.order()` chains
- Error handling via `error` destructuring

### State Management
- Local component state via `useState`
- Global auth state via `AuthContext`
- No Redux/Zustand (minimal app complexity)

### Icon System
- Lucide React for all icons
- Imported as needed per component

---

## Testing & Quality

- **TypeScript**: Strict type checking across codebase
- **ESLint**: Configured with React hooks rules
- **No tests file**: Project appears to be in active development

---

## Known Constraints & TODOs

1. **Screenshot Import**: Groq Vision API requires:
   - Valid API key in env
   - Image must contain readable grade table
   - Returns empty array if detection fails

2. **Messaging**: StudyMatch messaging not yet real-time (likely polling-based)

3. **RLS**: Database has row-level security policies (see `fix_rls_recursion.sql`)

4. **Moderation**: Admin panel handles material approval workflow

---

## File Structure Quick Reference

| File | Purpose |
|------|---------|
| `App.tsx` | Routes + Protected/Auth wrappers |
| `AuthContext.tsx` | Auth state + hooks |
| `supabase.ts` | Client init |
| `gemini.ts` | Groq Vision API wrapper |
| `DashboardLayout.tsx` | Sidebar nav |
| `calculator/index.tsx` | CGPA calculator UI |
| `materials/index.tsx` | Material repo UI |
| `studymatch/index.tsx` | Matching UI |
| `Overview.tsx` | Dashboard stats |
| `Landing.tsx` | Public homepage |
| `setup.sql` | DB schema |

---

## Summary

GradeForge is a **student-centric platform** combining CGPA management, social matching, and resource sharing. Built with modern React/TypeScript, it leverages Supabase for scalability and Groq's Vision API for intelligent screenshot parsing. The architecture is modular, focusing on user experience with glass morphism UI, role-based access, and efficient database queries.

**Status**: Active development  
**Stage**: Beta (supports 50+ universities)  
**Key Metric**: 5,200+ students  
