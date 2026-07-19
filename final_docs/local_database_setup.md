# Local Database & Project Setup — For Teammates
## Distribution Management System (DMS)

| | |
|---|---|
| **Purpose** | Get the project (database + backend + frontend) running on your own laptop, so we're both working on the same setup |
| **Related Docs** | `project_setup.md`, `database_schema_docs.markdown`, `build_guide.md` |

> **Note:** `venv/`, `.env`, and `node_modules/` are not stored in Git (see `.gitignore`) — each person creates their own. This is normal and expected; it's why you need to follow this guide instead of just pulling the code and running it.

---

## 1. Install Prerequisites

Install these first. Check versions with the commands shown.

| Tool | Version | Check |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 20 LTS+ | `node --version` |
| PostgreSQL | 15+ | `psql --version` |
| Git | Latest | `git --version` |

If PostgreSQL isn't installed, download it from postgresql.org and install it. During install, you'll be asked to set a **password for the `postgres` user** — remember it, you'll need it below.

---

## 2. Get the Code

```bash
git clone <repo-url>
cd FMCG_Product
```

You should now see this structure:
```
FMCG_Product/
├── backend/
├── frontend/
└── final_docs/
```

---

## 3. Set Up PostgreSQL Locally

### Step 1 — Confirm PostgreSQL is running
Windows: check the "Services" app for a running `postgresql-x64-...` service.
Mac/Linux: `pg_isready`

### Step 2 — Create the database
Open a terminal and connect as the `postgres` user:
```bash
psql -U postgres -h localhost -p 5432
```
It will ask for the password you set during install. Once connected, run:
```sql
CREATE DATABASE dms_db;
\q
```

That's it — the database itself starts empty. Tables are created in Step 5 below, by running migrations (not manually).

---

## 4. Set Up the Backend (FastAPI)

### Step 1 — Create your own virtual environment
```bash
cd backend
python -m venv venv
```

Activate it:
```bash
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### Step 2 — Install dependencies
The exact package versions are already recorded in `requirements.txt` — just install from it:
```bash
pip install -r requirements.txt
```

### Step 3 — Create your own `.env` file
This file is not in Git, so create it yourself at `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/dms_db
SECRET_KEY=change-this-to-a-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
```
Replace `<your-password>` with the PostgreSQL password you set in Step 3.2. Everything else can stay as shown.

### Step 4 — Run the database migrations
This is what actually creates all the tables inside `dms_db`, based on the models already written in the code:
```bash
alembic upgrade head
```
If this runs with no errors, your database now has the same tables as everyone else on the team.

### Step 5 — Start the backend
```bash
uvicorn main:app --reload
```
Open `http://localhost:8000/api/v1/health` — you should see:
```json
{"status": "ok"}
```
Open `http://localhost:8000/docs` — you should see the interactive API documentation (Swagger UI).

If both of those work, your backend + database are fully set up.

---

## 5. Set Up the Frontend (Next.js)

### Step 1 — Install dependencies
```bash
cd ../frontend
npm install
```

### Step 2 — Create your own `.env.local` file
This is also not in Git — create it yourself at `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### Step 3 — Start the frontend
```bash
npm run dev
```
Open `http://localhost:3000` (or whatever port it says, if 3000 is already taken) — you should see the default Next.js page.

---

## 6. Daily Workflow (After Initial Setup)

Every time you sit down to work:

```bash
git pull                      # get the latest code
cd backend
venv\Scripts\activate         # (or source venv/bin/activate on Mac/Linux)
alembic upgrade head          # apply any new migrations your teammate added
uvicorn main:app --reload
```

In a second terminal:
```bash
cd frontend
npm run dev
```

> **Important:** if your teammate adds a new database table (a new migration file), you must run `alembic upgrade head` again to get it locally. Migrations are the only thing that keeps both of your databases in sync — never edit tables manually in `psql`.

---

## 7. Staying in Sync as a Team

- **Never commit `.env` or `.env.local`** — they contain machine-specific values (like your PostgreSQL password). This is already handled by `.gitignore`.
- **Always commit the `alembic/versions/` migration files** — this is how your teammate's database gets the same tables as yours. If you add/change a model, always run `alembic revision --autogenerate -m "..."` and commit the generated file.
- **If `requirements.txt` changes** (someone installed a new package), run `pip install -r requirements.txt` again after pulling.
- **If `package.json` changes** (someone installed a new npm package), run `npm install` again after pulling.
- Follow `api_work_allocation.md` for who's building which domain, and `build_guide.md` for how to build each one — this avoids both of you editing the same files at the same time.

---

## 8. Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `psql: command not found` | PostgreSQL not installed or not on PATH | Reinstall, or add its `bin` folder to your system PATH |
| `password authentication failed for user "postgres"` | Wrong password in `.env` | Double-check the password you set during PostgreSQL install |
| `database "dms_db" does not exist` | Step 3.2 skipped | Run the `CREATE DATABASE dms_db;` command |
| `alembic upgrade head` fails with connection error | Backend `.env` has wrong `DATABASE_URL`, or PostgreSQL isn't running | Check `.env`, confirm PostgreSQL service is running |
| `uvicorn: command not found` | Virtual environment not activated, or dependencies not installed | Activate `venv`, then `pip install -r requirements.txt` |
| CORS error in browser console | Frontend URL not allowed in backend | Confirm backend `main.py` allows `http://localhost:3000` (or your actual frontend port) |
| Frontend calls return 404 | `.env.local` missing or wrong `NEXT_PUBLIC_API_BASE_URL` | Recheck `frontend/.env.local` |
| Two dev servers conflict on the same port | A previous `npm run dev` or `uvicorn` process is still running | Find and stop the old process, or just use the new port it suggests |

---

*This guide gets a second developer to a fully working local copy of the project. Once both of you can see `{"status": "ok"}` at `/api/v1/health` and the Next.js homepage locally, you're both ready to start building from `build_guide.md`.*
