# AstroVastu Pro

Professional Vastu analysis software — upload floor plans, overlay the Shakti Chakra compass, mark objects and activities, get verdicts with remedies, and generate PDF reports.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Supabase** — Auth, Postgres database, Storage (floor plan images)
- **Konva / react-konva** — Canvas editor for floor plan annotation
- **jsPDF** — Server-side PDF report generation
- **Payment gateway** — Razorpay or Cashfree (to be integrated)

## Getting Started

### 1. Environment variables

Copy the example and fill in your keys:

```bash
cp .env.local.example .env.local
```

You need:

- A Supabase project (URL + anon key + service role key)

### 2. Database setup

Run the SQL migration in your Supabase SQL Editor:

```
supabase/migrations/00001_initial_schema.sql
```

This creates tables (profiles, projects, layouts, layout_markers), RLS policies, a signup trigger, and a private storage bucket for floor plans.

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Try the core product without Supabase

After `npm run dev`, open **[http://localhost:3000/demo](http://localhost:3000/demo)** — a sample floor plan loads with the full editor (boundary, Shakti Chakra, object markers). No login or `.env` required for this route. Changes stay in the browser session only; cloud save and PDF need Supabase + sign-in.

## Project Structure

```
src/
  app/
    (marketing)/       — Landing page, pricing (public)
    (app)/             — Dashboard, project details, layout editor (authenticated)
    auth/              — Login, signup, OAuth callback
    api/
      pdf/[layoutId]/  — PDF report generation
  components/
    ui/                — Button, Input, Select
    vastu-editor/      — EditorCanvas, EditorToolbar, MarkerPanel, VastuEditorWrapper
  lib/
    supabase/          — Client, server, middleware helpers
  types/
    database.ts        — TypeScript types, marker taxonomy, feature flags
supabase/
  migrations/          — SQL schema
```

## Features (MVP)

- Marketing landing page + pricing
- Email/password auth (Supabase)
- Project CRUD with client metadata
- Layout upload with floor plan image
- Interactive polygon boundary editor (add/move/delete nodes)
- Draggable center point
- Shakti Chakra overlay (16 directions, 32 entrance ticks, rotatable)
- Object/activity/utility marking with taxonomy dropdown
- Verdict (good/bad/neutral) + remedy text per marker
- PDF report export

## Deferred (scaffolded)

- Payment gateway integration (Razorpay / Cashfree)
- Measurement tool
- Devta / Marma / Body Part / Prakriti / Tri Dosha / Tri Guna overlays
- Devta Activation
- Astro Kundli module

