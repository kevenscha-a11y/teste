# EduPlay - Plataforma de Cursos Online

## Overview

Full-stack online course platform similar to Udemy/Netflix. Built with React + Vite frontend, Express API backend, and PostgreSQL database.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, TanStack Query, Wouter, Framer Motion, Shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
artifacts/
  api-server/         # Express API backend
  course-platform/    # React/Vite frontend (at /)
lib/
  api-spec/           # OpenAPI spec + Orval codegen
  api-client-react/   # Generated React Query hooks
  api-zod/            # Generated Zod schemas
  db/                 # Drizzle ORM schema + DB connection
scripts/
  src/seed.ts         # Database seeding script
```

## Demo Users

- **Admin**: admin@eduplay.com / admin123
- **Student**: student@eduplay.com / student123

## Features

### Admin Area
- Login with admin credentials
- Dashboard: view all courses with stats (lessons, students, published status)
- Create/edit/delete courses (title, description, thumbnail URL, publish toggle)
- Manage sections within courses (add/edit/delete/reorder)
- Manage lessons within sections (title, description, video URL, duration, order)

### Student Area
- Register/login
- Browse course catalog
- Enroll in courses
- Watch video lessons (YouTube embeds or direct URLs)
- Mark lessons as complete (manually or auto-mark on video end)
- View progress bar per course
- View enrolled courses on "My Courses" page
- Generate certificate when course is 100% complete

## API Routes

All routes under `/api`:
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- `GET /courses` (public catalog), `GET /courses/admin` (admin only)
- `POST /courses/create`, `GET/PATCH/DELETE /courses/:id`
- `GET/POST /courses/:courseId/sections`, `PATCH/DELETE /sections/:id`
- `POST /sections/:sectionId/lessons`, `PATCH/DELETE /lessons/:id`
- `POST /courses/:courseId/enroll`, `GET /enrollments`
- `POST/DELETE /progress/:lessonId`, `GET /courses/:courseId/progress`
- `GET /certificates/:courseId`

## DB Schema

Tables: `users`, `courses`, `sections`, `lessons`, `enrollments`, `lesson_progress`

## Codegen

Run codegen after changing OpenAPI spec:
```bash
pnpm --filter @workspace/api-spec run codegen
```
