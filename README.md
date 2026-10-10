# Chess Tournament Management System

A full-stack web platform for competitive chess tournaments with FIDE-standard Swiss pairing algorithms, Single Elimination knockout brackets, and server-authoritative match clocks (PRD v1.0).

---

## 📁 Project Architecture

The project is structured into two clean, independent directories:

- **`/frontend`**: React + Vite + Tailwind CSS + Lucide Icons (configured for **Vercel** deployment with `vercel.json` SPA rewrites).
- **`/backend`**: Node.js + Express + Prisma ORM + PostgreSQL (configured for **Render** deployment with `render.yaml`).

---

## 🚀 Local Development Setup

### 1. Backend (`/backend`)
```bash
cd backend
npm install
npx prisma db push
npm run seed     # Initializes the clean Admin account
npm start        # Runs API on http://localhost:5001
```

**Default Admin Credentials:**
- **Username:** `admin`
- **Password:** `adminpassword123`

### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev      # Runs client on http://localhost:5173
```

---

## 🌐 Production Deployment

### Deploy Backend on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the following:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma db push`
   - **Start Command:** `npm start`
4. In **Environment Variables**, provide:
   - `DATABASE_URL`: Your PostgreSQL connection string (e.g. from Neon / Supabase / Render Postgres).
   - `SESSION_SECRET`: A long secure string.
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://chess-arena.vercel.app`).

### Deploy Frontend on Vercel
1. Create a new project on [Vercel](https://vercel.com).
2. Connect your Git repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. In **Environment Variables**, provide:
   - `VITE_API_URL`: Your live Render backend URL (e.g. `https://chess-tournament-backend.onrender.com`).
6. Deploy! (`vercel.json` handles client-side routing automatically).

