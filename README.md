# 🛡️ CyberShield Lite

**Affordable cybersecurity monitoring for Small & Medium Businesses**

---

## ⚡ Quickstart (Choose one method)

### Method A — Single command (recommended)

```bash
# 1. Install root dependencies
npm install

# 2. Copy and fill in your .env
cp backend/.env.example backend/.env
# Open backend/.env → set MONGO_URI and JWT_SECRET (see below)

# 3. Start everything
npm run dev
```

This starts all 3 services at once:
| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:5000 |
| Scanner  | http://localhost:8000 |

---

### Method B — Windows one-click script

Double-click `start.bat`

It will:
- Check Node + Python are installed
- Auto-create `.env` from example
- Install all dependencies automatically
- Start each service in a separate terminal window

---

### Method C — Docker Compose

```bash
# Copy and fill in JWT_SECRET
cp .env.example .env
# Edit .env → set JWT_SECRET

# Build and run all services
docker compose up --build

# App → http://localhost:3000
```

> **Windows 10 note:** Uses named volumes instead of bind mounts to avoid  
> OverlayFS metadata corruption issues with Docker Desktop + WSL2.

---

## 🔧 Environment Setup (Required)

### 1. Create `backend/.env`

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set these two **required** values:

```env
MONGO_URI=mongodb://localhost:27017/cybershield
JWT_SECRET=paste_your_generated_secret_here
```

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

The server **will not start** and will print a clear error message if either value is missing.

---

## 📦 Prerequisites

| Tool       | Version  | Download                                       |
|------------|----------|------------------------------------------------|
| Node.js    | 18+      | https://nodejs.org                             |
| Python     | 3.11+    | https://python.org                             |
| MongoDB    | 7.0      | https://www.mongodb.com/try/download/community |
| npm        | 9+       | Comes with Node                                |

### MongoDB on Windows (D drive)

If your C drive is full, install MongoDB to D drive and set:

```env
MONGO_URI=mongodb://localhost:27017/cybershield
```

MongoDB data directory can be changed during installation — point it to `D:\mongodb\data`.

**Minimum disk space:** 2 GB free on the MongoDB data drive.

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  React Frontend  │────▶│  Node.js API     │────▶│  Python Scanner      │
│  Port 3000       │     │  Port 5000       │     │  Port 8000           │
│  Tailwind + CS   │     │  Express + JWT   │     │  FastAPI             │
│  Design tokens   │     │  Rate limiting   │     │  SSL · Headers · Ports│
└──────────────────┘     └──────────────────┘     └──────────────────────┘
                                  │
                         ┌────────▼──────────┐
                         │  MongoDB          │
                         │  Port 27017       │
                         └───────────────────┘
```

All service URLs are ENV-based. No hardcoded localhost URLs in code.

---

## 📂 Project Structure

```
cybershield-lite/
├── package.json              ← Root: npm run dev starts everything
├── start.bat                 ← Windows one-click startup
├── start.sh                  ← Mac/Linux startup
├── docker-compose.yml
│
├── frontend/                 ← React 18 + Tailwind
│   └── src/
│       ├── components/ui/    ← Card, Button, SeverityBadge, chartTheme
│       ├── pages/            ← Dashboard, Scan, Phishing, History
│       ├── context/          ← AuthContext (JWT)
│       └── services/api.js   ← All API calls
│
├── backend/                  ← Node.js + Express
│   ├── .env.example
│   └── src/
│       ├── controllers/      ← auth, scan, phishing, dashboard, report
│       ├── middleware/        ← auth guard, error handler
│       ├── models/           ← User, Scan, PhishingReport
│       ├── routes/
│       └── utils/            ← JWT, validators, logger, env.validator
│
└── scanner/                  ← Python FastAPI microservice
    ├── app.py
    ├── scanners/             ← ssl, headers, ports, tech, phishing
    └── utils/score_calculator.py
```

---

## 🔑 API Endpoints

| Method | Endpoint               | Description             | Auth |
|--------|------------------------|-------------------------|------|
| POST   | `/api/auth/register`   | Create account          | No   |
| POST   | `/api/auth/login`      | Login                   | No   |
| GET    | `/api/auth/me`         | Current user            | Yes  |
| POST   | `/api/scan/website`    | Start scan (async)      | Yes  |
| GET    | `/api/scan/:scanId`    | Poll scan result        | Yes  |
| GET    | `/api/scan/history`    | Scan history            | Yes  |
| POST   | `/api/phishing/analyze`| Analyze email           | Yes  |
| GET    | `/api/dashboard`       | Dashboard data          | Yes  |
| GET    | `/api/report/:scanId`  | Download PDF            | Yes  |
| GET    | `/health`              | Backend health check    | No   |
| GET    | `http://localhost:8000/health` | Scanner health | No |

---

## 🔒 Security Features

- `JWT_SECRET` and `MONGO_URI` validated at startup — server refuses to start if missing
- bcrypt password hashing (12 rounds)
- Rate limiting: 100 req/15min global, 10 scans/hour per user
- Private IP blocking (no SSRF — localhost/10.x/192.168.x blocked)
- Helmet.js security headers on all API responses
- Input validation (Joi) on all endpoints
- Non-root user in Docker containers

---

## 🐛 Troubleshooting

**MongoDB connection error: uri must be a string**
→ `backend/.env` file is missing or `MONGO_URI` is not set.
Run: `cp backend/.env.example backend/.env` and fill in values.

**JWT Secret must have a value**
→ `JWT_SECRET` is empty in `backend/.env`.
Generate one: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

**Scan always fails / Scanner error**
→ Python scanner is not running.
Start it: `cd scanner && python app.py`
Test it: `curl http://localhost:8000/health`

**Docker build stuck / OverlayFS error (Windows)**
→ Use `start.bat` instead of Docker, or:
1. Open Docker Desktop → Settings → Reset to factory defaults
2. Ensure WSL2 is set as backend (not Hyper-V)
3. Run `docker compose down -v` then `docker compose up --build`

**C drive out of space**
→ Install MongoDB to D drive. Set data path to `D:\mongodb\data` during setup.
Minimum 2 GB free space required.

**Port already in use**
→ Check what is running: `netstat -ano | findstr :5000` (Windows)
Kill it or change the port in `.env`.

---

## 📅 Roadmap (Post-MVP)

- [ ] Continuous scheduled scanning
- [ ] Email alerts for new vulnerabilities
- [ ] Dark web breach monitoring
- [ ] Multi-user company accounts
- [ ] Subscription billing (Razorpay)
- [ ] AI-based threat detection

---

Built for Indian SMEs | CyberShield Lite v1.0
