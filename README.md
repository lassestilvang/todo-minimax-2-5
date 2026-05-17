# TaskFlow - Daily Task Planner

A beautiful daily task planner built with Next.js, Prisma, and Tailwind CSS.

## Features

- Create and manage tasks with due dates, priorities, and time estimates
- Organize tasks into lists and labels
- Time tracking with timer and manual entries
- Smart views: Today, Next 7 Days, Upcoming, All Tasks
- Keyboard shortcuts (Ctrl+N for new task)
- Dark/light theme support
- Responsive design

## Tech Stack

- Next.js 16 (App Router)
- Prisma with SQLite
- React 19
- Tailwind CSS 4
- TypeScript
- Lucide React (icons)
- date-fns

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up the database:
   ```bash
   bunx prisma db push
   ```

3. Run the development server:
   ```bash
   bun run dev
   ```

4. Open http://localhost:3000

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint