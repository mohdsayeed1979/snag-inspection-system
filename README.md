# Villa Snag List & Inspection Management System

An enterprise-grade, responsive, and secure Villa Snag List / Inspection Management System built with **React 19**, **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

The system enables site engineers, QA/QC inspectors, supervisors, contractors, and client representatives to collaborate, audit, and log construction snag items, track completion percentages, and export professional reports for clients or management.

---

## 🚀 Key Features

1. **Role-Based Access Control (RBAC)**:
   - **Super Admin** & **Project Manager**: Full database, categories, block sectors, and settings control.
   - **Site Engineer** & **QA/QC Inspector**: Can raise new snags, edit remarks, verify repairs.
   - **Contractor**: Restrictive status controls (can only update status to `in_progress` or `rectified` for assigned snags).
   - **Read-Only**: Static viewing and report exporting capabilities.
2. **Interactive Checklist Datatable**:
   - Dynamic sorting, global searching, and advanced filters (by category, priority, status, due dates).
   - Deep-linked details drawer containing timeline history logs and comment threads.
3. **Excel & PDF Export Center**:
   - **Excel Export**: Custom styled ExcelJS sheet with frozen headers, automatic column dimensions, priority color-coding, and summary counters.
   - **PDF Export**: Client-ready PDF reports with progress ratios, before/after inspection photos, and signature blocks.
4. **Excel checklist Import**:
   - Parses field check columns, maps categories, checks for duplicates, and generates villa checklists.
5. **Zero-Config Developer Sandbox**:
   - Automatically detects if Supabase keys are missing and boots a local storage-backed mock SQL database populated with 30 villas and 300+ snag items!

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS (v4), TypeScript.
- **Reporting**: ExcelJS, jsPDF, jsPDF-AutoTable.
- **Charts**: Recharts.
- **Database / Backend**: Supabase (Postgres Database, RLS Policies, triggers).

---

## ⚙️ Quick Start

### 1. Clone & Install Dependencies

```bash
# Install packages
npm install
```

### 2. Run the Development Server

If you run the app without setting up Supabase, the **Zero-Config Developer Sandbox** automatically kicks in. It pre-populates your browser storage with:
- 1 Project: *Luxury Villa Compound*
- 3 Blocks: *Block A, B, and C*
- 30 Villas: *Villa 01* to *Villa 30*
- 300+ Snag Items of varying statuses and priorities.

```bash
# Run server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it. Use the **Role Selector** in the top header to swap between users and test role-based access rules.

---

## 🗄️ Supabase Production Setup

To transition from the local sandbox to a live production database:

### 1. Create a Supabase Project
Sign in to [Supabase Console](https://supabase.com) and spin up a new PostgreSQL database project.

### 2. Apply SQL Migrations
Navigate to the SQL Editor in your Supabase Dashboard, open `supabase/migrations/20260719000000_init.sql`, and execute it. This script:
- Creates the schemas (`projects`, `blocks`, `villas`, `profiles`, `inspection_items`, `inspection_photos`, `inspection_comments`, `inspection_history`, etc.).
- Installs triggers to automatically sync signups and compute Villa/Project completion rates in real-time.
- Enables Row Level Security (RLS) policies based on user roles.

### 3. Seed Mock Data
Open `supabase/seed.sql` in the SQL Editor and execute it to populate your live database with the default inspection categories, checklist templates, 30 villas, and initial snags.

### 4. Configure Environment Variables
Create a `.env.local` file at the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Restart the development server. The application will now read and write directly to your cloud Supabase database!

---

## ☁️ Vercel Deployment

Deploying the Next.js application to Vercel takes just a few clicks:

1. Push your code repository to GitHub, GitLab, or Bitbucket.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will build and serve your production bundle.

---

## 📂 Project Architecture

```
├── public/                 # Static assets
├── supabase/
│   ├── migrations/         # PostgreSQL tables and RLS policies
│   └── seed.sql            # Seeding data
└── src/
    ├── app/
    │   ├── admin/          # Admin Control Panel
    │   ├── dashboard/      # Control graphs and recent logs
    │   ├── villas/         # Blocks & Villas grid explorer
    │   │   └── [id]/       # Villa checklist table and comments
    │   ├── globals.css     # Tailwind v4 variables and custom styles
    │   └── layout.tsx      # Main layout wraps with providers
    ├── components/
    │   └── layout-shell.tsx# Sidebar, Header, Search & Notifications
    ├── context/
    │   └── AuthContext.tsx # User context and RBAC validation
    └── lib/
        ├── db.ts           # Database connection & LocalStorage database
        ├── exportCenter.ts # ExcelJS and jsPDF rendering logic
        └── importCenter.ts # Excel parsing and verification engine
```
