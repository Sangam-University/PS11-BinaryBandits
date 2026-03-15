# UdhyaamOS — The Operating System for India's MSMEs

> A dual-sided platform connecting **MSMEs (small businesses)** with **Student / Junior Professionals**, enabling talent sourcing, B2B trade, and community collaboration — all in one place.

---

## Table of Contents

- [The Idea](#the-idea)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [How to Run](#how-to-run)
- [Docker Deployment](#docker-deployment)
- [User Roles & Flows](#user-roles--flows)
- [AI Matching Engine](#ai-matching-engine)

---

## The Idea

India has 63 million MSMEs that are digitally underserved — they struggle to hire affordable talent, discover B2B suppliers, and build professional networks. On the other side, millions of students and junior professionals lack real-world project experience and income.

**UdhyaamOS** bridges this gap with three interconnected modules:

| Module | Description |
|---|---|
| **TalentBridge** | A bounty marketplace where MSMEs post paid tasks and JuniorPros bid, negotiate, and deliver |
| **TradeSync** | A B2B product marketplace where businesses list bulk inventory and negotiate pricing |
| **Udhyaam Network** | A lightweight social feed for community posts, trending tags, and professional networking |

Add real-time chat, an AI-powered talent matching engine, and role-specific dashboards — and you get a full operating system for the MSME ecosystem.

---

## Key Features

### For Businesses (MSMEs)
- Post **bounties** (freelance tasks) with budget, deadline, and skill requirements
- Review bids, make counter-offers, and request **proof-of-concept (POC)** samples before committing
- Manage project **milestones**, request revisions, and approve final submissions
- List products on the **B2B marketplace** and negotiate pricing with buyers
- Maintain a private **digital catalog** of inventory
- Write reviews for completed projects and trade deals
- Social feed participation and community building

### For JuniorPros (Students / Freelancers)
- Browse the **job board** for open bounties filtered by skills and budget
- Place bids with custom pricing, submit POC samples, and negotiate with founders
- Manage **active tasks** through a milestone-based progress tracker
- Public profile with portfolio, skills, ratings, and completed project stats
- Real-time **chat** with clients, scoped to each bounty

### Platform-wide
- **AI Matching**: GPT-4o-mini ranks how well a JuniorPro matches a bounty and ranks all bidders for a founder
- **Google OAuth** + Email/Password authentication
- **File uploads** to AWS S3 (avatars, POC screenshots, project submissions)
- Full **bounty lifecycle** state machine with automated transitions
- Auto-created chat rooms when a bounty is awarded

---

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix primitives) + lucide-react |
| Animation | Framer Motion 12 |
| State | Zustand 5 (with localStorage persistence) |
| Routing | React Router DOM 7 |
| HTTP | Axios 1.x |

### Backend
| | |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Language | TypeScript 5.8 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | JWT + bcrypt + Google OAuth 2.0 |
| File Storage | AWS S3 (v3 SDK) |
| AI | OpenAI SDK → GitHub Models (GPT-4o-mini) |
| Dev | tsx + nodemon |

### Infrastructure
- **Docker** — containerized backend with `docker-compose`
- **AWS RDS** — managed PostgreSQL
- **AWS S3** — object storage for user uploads
- **GitHub Models** — Azure-hosted AI inference endpoint

---

## Project Structure

```
SUhack_UdhyaamOS/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Express app + route mounting
│   │   ├── config/
│   │   │   ├── index.ts           # Central env config
│   │   │   └── db.ts              # Singleton PrismaClient
│   │   ├── routes/                # Route definitions (auth, bounties, marketplace, …)
│   │   ├── controllers/           # Business logic handlers
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT authentication middleware
│   │   │   └── errorHandler.ts    # Global error handler
│   │   └── services/
│   │       ├── s3.ts              # S3 upload helper
│   │       └── ai.ts              # AI match scoring (GPT-4o-mini)
│   ├── prisma/
│   │   ├── schema.prisma          # Full database schema
│   │   └── migrations/            # SQL migration history
│   ├── .env                       # Backend environment variables
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Router + all routes
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx # Role-guarded route wrapper
│   │   │   └── ui/                # shadcn/ui + custom components
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── LoginSuccess.tsx   # OAuth callback handler
│   │   │   ├── business/          # Business role pages
│   │   │   └── junior-pro/        # JuniorPro role pages
│   │   ├── layouts/               # Role-specific sidebar layouts
│   │   ├── services/
│   │   │   └── api.ts             # Axios instance + all API functions + TS types
│   │   └── store/                 # Zustand stores (auth, bounty, chat, feed, …)
│   └── package.json
│
├── scripts/
│   ├── setup.sh                   # Linux/macOS setup script
│   └── setup.bat                  # Windows setup script
│
├── docker-compose.yml
├── package.json                   # Monorepo root (npm workspaces)
└── .env.example
```

---

## Database Schema

### Enums

| Enum | Values |
|---|---|
| `UserRole` | `Business`, `JuniorPro` |
| `BountyStatus` | `OPEN` → `BIDDING` → `IN_PROGRESS` → `REVIEW` → `REVISION_REQUESTED` → `COMPLETED` |
| `BidPocStatus` | `PENDING`, `ACCEPTED`, `DECLINED`, `SUBMITTED` |
| `MilestoneStatus` | `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `NegotiationStatus` | `PENDING`, `ACCEPTED`, `REJECTED`, `COUNTERED` |
| `ListingStatus` | `ACTIVE`, `SOLD_OUT`, `PAUSED` |
| `CatalogStatus` | `IN_STOCK`, `OUT_OF_STOCK` |

### Core Tables

| Table | Purpose |
|---|---|
| `users` | All users — Business fields (CIN, GSTIN, industry) + JuniorPro fields (skills, score, portfolio) |
| `bounties` | Freelance task postings with title, budget, deadline, status |
| `bids` | JuniorPro bids with counter-offer and POC workflow fields |
| `milestones` | Sub-tasks within a bounty |
| `bounty_feedbacks` | Revision requests and final ratings |
| `chat_conversations` | One chat per bounty, auto-created on award |
| `chat_messages` | Individual messages (text + optional image) |
| `marketplace_listings` | Public B2B product listings |
| `negotiations` | Counter-offer negotiations on marketplace listings |
| `reviews` | Post-deal ratings tied to a negotiation |
| `business_catalog` | Private inventory per business |
| `feed_posts` | Social feed posts with tags |
| `feed_replies` | Replies to posts |
| `post_likes` | User ↔ post likes (composite PK) |

---

## API Reference

All endpoints are prefixed with `/api`. Authenticated routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Path | Description |
|---|---|---|
| `POST` | `/register` | Register with email + password + role |
| `POST` | `/login` | Login with email + password |
| `POST` | `/google` | Google Sign-In with `idToken` |
| `GET` | `/google/init` | Redirect-based OAuth flow (`?role=`) |
| `GET` | `/google/callback` | OAuth callback → redirects to frontend |

### Users — `/api/users` (auth required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/me` | Get own profile |
| `PUT` | `/me` | Update own profile |
| `GET` | `/:userId/profile` | Public profile with stats and reviews |

### Bounties — `/api/bounties` (auth required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List bounties (role-filtered) |
| `POST` | `/` | Create bounty (Business) |
| `DELETE` | `/:id` | Delete bounty (Business, OPEN/BIDDING only) |
| `POST` | `/:id/bids` | Place a bid (JuniorPro) |
| `POST` | `/:id/bids/:studentId/counter` | Founder counter-offer |
| `PUT` | `/:id/bids/:studentId/respond` | JuniorPro responds to counter |
| `POST` | `/:id/bids/:studentId/poc/request` | Request proof-of-concept |
| `PUT` | `/:id/bids/:studentId/poc/respond` | Accept/decline POC request |
| `POST` | `/:id/bids/:studentId/poc/submit` | Submit POC link + screenshot |
| `POST` | `/:id/award/:studentId` | Award bounty → auto-creates chat |
| `POST` | `/:id/milestones` | Add milestone |
| `PUT` | `/:id/milestones/:milestoneId` | Update milestone status |
| `POST` | `/:id/submit` | Submit final project (JuniorPro) |
| `POST` | `/:id/revision` | Request revision (Business) |
| `POST` | `/:id/resubmit` | Resubmit after revision |
| `POST` | `/:id/approve` | Approve + mark COMPLETED (Business) |
| `POST` | `/:id/review` | Leave rating and comment |

### Marketplace — `/api/marketplace` (auth required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all active listings |
| `POST` | `/` | Create a listing |
| `DELETE` | `/:id` | Delete own listing |

### Negotiations — `/api/negotiations` (auth required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | My negotiations (as buyer or seller) |
| `POST` | `/` | Start a negotiation |
| `PUT` | `/:id/respond` | Accept / reject / counter |

### Catalog — `/api/catalog` (auth required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get own catalog items |
| `POST` | `/` | Add a catalog item |

### Chats — `/api/chats` (auth required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List my conversations |
| `GET` | `/:id/messages` | Get messages in a conversation |
| `POST` | `/:id/messages` | Send a message |

### Feed — `/api/feed` (auth required)
| Method | Path | Description |
|---|---|---|
| `GET` | `/trending` | Trending tags |
| `GET` | `/` | List posts (`?tag=` filter) |
| `POST` | `/` | Create a post |
| `POST` | `/:id/like` | Toggle like |
| `POST` | `/:id/replies` | Reply to a post |
| `DELETE` | `/:id/replies/:replyId` | Delete a reply |
| `DELETE` | `/:id` | Delete own post |

### Upload — `/api/upload` (auth required)
| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Upload image to S3 (`?folder=avatars\|submissions\|screenshots\|uploads`) → returns `{ url }` |

### AI — `/api/ai` (auth required)
| Method | Path | Description |
|---|---|---|
| `POST` | `/match-percentage` | AI match score for current user vs. a bounty |
| `POST` | `/best-match` | AI-ranked leaderboard of all bidders for a bounty |

### Health
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | `{ status: "ok", timestamp }` |

---

## Environment Variables

Copy `.env.example` to `backend/.env` and fill in the values.

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"

# JWT
JWT_SECRET="your-64-char-secret"
JWT_EXPIRES_IN="7d"

# AWS
AWS_ACCESS_KEY_ID="your-key-id"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="your-bucket-name"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"

# GitHub Models (AI)
GITHUB_TOKEN="github_pat_your_token"

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`.env` in `frontend/`)

```env
VITE_API_URL=http://localhost:5000/api
```

> **Note:** If `VITE_API_URL` is not set, the frontend defaults to `http://localhost:5000/api`.

---

## How to Run

### Prerequisites

- **Node.js** 18 or higher
- **npm** 8 or higher
- A **PostgreSQL** database (local or cloud)
- **AWS S3** bucket + IAM credentials with `s3:PutObject` permission
- **Google OAuth** app (create at [console.cloud.google.com](https://console.cloud.google.com))
- **GitHub Personal Access Token** with access to GitHub Models (for AI features)

---

### 1. Clone & Install

```bash
git clone <repo-url>
cd SUhack_UdhyaamOS

# Install all dependencies (root + frontend + backend)
npm run install:all
```

---

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example backend/.env

# Open and fill in your credentials
nano backend/.env
```

---

### 3. Set Up the Database

```bash
# Run all migrations
npm run migrate

# Or manually from the backend directory:
cd backend
npx prisma migrate dev
cd ..
```

---

### 4. Start the Development Server

```bash
# Start both frontend and backend concurrently
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

---

### Individual Services

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

---

### Production Build

```bash
# Build both
npm run build

# Start production servers
npm run start
```

---

### Useful Database Commands

Run these from the `backend/` directory:

```bash
npx prisma migrate dev          # Apply new migrations (dev)
npx prisma migrate deploy       # Apply migrations (production)
npx prisma db push              # Push schema without migration files
npx prisma generate             # Regenerate Prisma client after schema changes
npx prisma studio               # Open database browser UI
```

---

## Docker Deployment

A `Dockerfile` for the backend and a `docker-compose.yml` are included.

```bash
# From project root
docker-compose up -d
```

This builds and starts the backend API on port `5000`. Make sure `backend/.env` is populated before running.

> The frontend is a static SPA — deploy it to Vercel, Netlify, or any static host by running `npm run build` inside `frontend/` and serving the `dist/` folder.

---

## User Roles & Flows

### Business (MSME)

```
Register as Business
    │
    ├── TalentBridge
    │     ├── Post a bounty (title, description, budget, deadline, skills)
    │     ├── Review incoming bids
    │     ├── Counter-offer or request POC
    │     ├── Award to best bidder (auto-creates chat)
    │     ├── Track milestones
    │     ├── Request revision or approve submission
    │     └── Leave a rating
    │
    ├── TradeSync
    │     ├── List products for bulk B2B sale
    │     ├── Receive and respond to buyer negotiations
    │     └── Mark deals as accepted/rejected
    │
    ├── Catalog
    │     └── Maintain private inventory
    │
    ├── Messages
    │     └── Chat with awarded JuniorPros
    │
    ├── Udhyaam Network
    │     └── Post updates, like, reply, follow trending tags
    │
    └── Digital Vault
          └── Edit profile, business details (CIN, GSTIN), avatar
```

### JuniorPro (Student / Freelancer)

```
Register as JuniorPro
    │
    ├── Job Board
    │     ├── Browse open bounties
    │     ├── View AI match percentage
    │     ├── Place a bid with custom price
    │     ├── Negotiate counter-offers
    │     └── Submit POC if requested
    │
    ├── Active Tasks
    │     ├── Track milestones
    │     ├── Submit final project
    │     └── Resubmit after revision request
    │
    ├── Messages
    │     └── Chat with founders per bounty
    │
    └── Digital Vault
          └── Edit skills, portfolio URL, bio, avatar
```

---

## AI Matching Engine

The platform uses **GPT-4o-mini via GitHub Models** (Azure AI inference endpoint) for two AI features:

### 1. Match Percentage (`POST /api/ai/match-percentage`)
Given a bounty and the current JuniorPro's profile (skills, rating, completed project count), the AI returns a 0–100% compatibility score. Shown on the Job Board so students know how well-suited they are before bidding.

### 2. Best Match Ranking (`POST /api/ai/best-match`)
Given a bounty and all its bids, the AI scores each bidder across multiple dimensions (skill overlap, price competitiveness, experience, profile completeness) and returns a ranked leaderboard. Helps founders make data-driven hiring decisions.

Both features are powered by `backend/src/services/ai.ts` using the OpenAI SDK pointed at:
```
https://models.inference.ai.azure.com
```

To enable AI features, set `GITHUB_TOKEN` in your backend `.env` to a GitHub Personal Access Token with GitHub Models access.
