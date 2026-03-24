# CIPD Lab — Inventory Management System (IMS)

A full-stack web application for managing the inventory of the **CIPD (Centre for Innovation, Product Development)** Electronics Lab at IIIT Delhi. Students can browse components, add them to a cart, and submit borrow requests. Admins can approve/decline requests, manage inventory, and track issued items.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | PostgreSQL 14+ with Prisma ORM |
| Auth | JWT tokens + bcrypt password hashing |

---

## Quick Start

> For detailed setup instructions (PostgreSQL user creation, troubleshooting, etc.), see [SETUP.md](SETUP.md).

```bash
# 1. Clone the repo
git clone <repo-url> && cd IMS

# 2. Backend
cd backend
npm install
cp .env.example .env          # edit if your DB credentials differ
npx prisma migrate dev         # create tables
node prisma/seed.js            # seed admin + student + 9 categories
node prisma/seedItems.js       # seed 105 CIPD inventory items
npm run dev                    # starts on http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                    # starts on http://localhost:5173
```

### Default Logins (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cipd.iiitd.ac.in` | `admin123` |
| Student | `test@iiitd.ac.in` | `test123` |

---

## Project Structure

```
IMS/
├── frontend/                    # React + Vite app
│   └── src/
│       ├── main.jsx             # App entry point
│       ├── App.jsx              # All route definitions
│       ├── index.css            # Theme variables + global styles
│       ├── context/
│       │   └── AuthContext.jsx   # Global auth state (user, login, logout)
│       ├── utils/
│       │   ├── api.js           # Axios instance with JWT interceptor
│       │   └── validation.js    # Pure validation functions (email, password)
│       ├── components/
│       │   ├── Layout.jsx       # App shell (Navbar + Sidebar + content)
│       │   ├── Navbar.jsx       # Top bar (logo, user info, logout)
│       │   ├── Sidebar.jsx      # Left nav (role-based links)
│       │   ├── ProtectedRoute.jsx  # Auth + role guard
│       │   └── ui/
│       │       ├── TextInput.jsx    # Reusable text input
│       │       └── PasswordInput.jsx # Password input + strength bar
│       └── pages/
│           ├── Login.jsx        # Login form (student/admin tabs)
│           ├── Signup.jsx       # Student registration
│           ├── Placeholder.jsx  # Placeholder for unbuilt pages
│           ├── student/
│           │   ├── Dashboard.jsx     # Student home (stats, recent requests)
│           │   ├── Inventory.jsx     # Category grid + search bar
│           │   └── CategoryItems.jsx # Items table within a category
│           └── admin/
│               └── Dashboard.jsx     # Admin home (stats, pending requests)
│
├── backend/                     # Node.js + Express API
│   ├── .env                     # Environment variables
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (7 models, 5 enums)
│   │   ├── seed.js              # Seeds admin, student, categories
│   │   └── seedItems.js         # Seeds 105 CIPD inventory items
│   └── src/
│       ├── index.js             # Express server entry point
│       ├── routes/
│       │   ├── auth.js          # /api/auth/* (signup, login, me, logout)
│       │   └── inventory.js     # /api/inventory/* (categories, items, search)
│       ├── middleware/
│       │   ├── auth.js          # JWT verification + role authorization
│       │   └── errorHandler.js  # Global error handler
│       └── utils/
│           └── jwt.js           # Token generation + verification
│
├── SETUP.md                     # Full setup guide with troubleshooting
└── ReadMe.MD                    # This file
```

---

## Phase-by-Phase Development Log

### Phase 1 — Project Setup + Login Page

**What was built:**
- Initialized the React (Vite) frontend and installed Tailwind CSS
- Created the **Login page** with a split-screen design:
  - Left panel (60%): navy-themed branding with CIPD lab description
  - Right panel (40%): login form with Student/Admin tab toggle
- Set up the Vite config with proxy to forward `/api` requests to `localhost:5000`

**Key concepts introduced:**
- **Vite** — a modern build tool that starts instantly (unlike Create React App)
- **Tailwind CSS** — utility classes like `bg-blue-500 px-4 py-2` instead of writing CSS files
- **CSS Custom Properties** — theme colors defined in `index.css` as `--color-primary`, etc.

**Files created:**
- `frontend/` project scaffold (package.json, vite.config.js, index.html)
- `frontend/src/main.jsx`, `App.jsx`, `index.css`
- `frontend/src/pages/Login.jsx`

---

### Phase 2 — Student Signup Page

**What was built:**
- **Signup page** with same split-screen layout as Login
- **Validation utilities** — pure functions for email, password, required fields
- **Reusable UI components** — TextInput (label + error) and PasswordInput (show/hide toggle + strength bar)
- Validates IIITD email format (`@iiitd.ac.in` only)
- Password strength indicator (weak/medium/strong)
- Per-field validation on blur, full validation on submit

**Key concepts introduced:**
- **Pure functions** — `validateEmail(value)` returns `null` (valid) or error string. No side effects, easy to test
- **Controlled components** — React manages input values via `useState`, not the DOM
- **Validate on blur** — errors appear when you tab/click away from a field, not while typing
- **Component reusability** — `TextInput` and `PasswordInput` used in both Login and Signup

**Files created:**
- `frontend/src/pages/Signup.jsx`
- `frontend/src/utils/validation.js`
- `frontend/src/components/ui/TextInput.jsx`
- `frontend/src/components/ui/PasswordInput.jsx`

---

### Phase 3 — Dashboards + App Shell

**What was built:**
- **AuthContext** — React Context that stores the logged-in user globally. Any component can call `useAuth()` to read user data without prop drilling
- **Layout** — app shell with fixed Navbar at top and collapsible Sidebar on the left. Page content renders inside via React Router's `<Outlet>`
- **Navbar** — logo, sidebar toggle, user avatar + role badge, cart icon (students), notification bell, logout button
- **Sidebar** — role-based navigation links:
  - Student: Dashboard, Browse Inventory, My Cart, My Requests, My Profile
  - Admin: Dashboard, Inventory, Requests, Issued Items, Add Item
  - Collapses to icon-only mode (72px) with tooltips on hover
- **ProtectedRoute** — wrapper that redirects unauthenticated users to `/login` and wrong-role users to their own dashboard
- **Student Dashboard** — welcome hero, 4 stat cards, recent requests list, issued items list (demo data)
- **Admin Dashboard** — admin hero, 4 stat cards (pending requests, inventory count, issued, low stock), pending request cards with approve/decline buttons (demo), low stock alerts

**Key concepts introduced:**
- **React Context** — avoids passing `user` as a prop through every component ("prop drilling")
- **React Router `<Outlet>`** — how nested routes render inside a parent layout
- **`<NavLink>`** — auto-applies "active" class to the link matching the current URL
- **Role-based rendering** — `isAdmin()` check determines which sidebar links and dashboard to show

**Files created:**
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/components/Layout.jsx`
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Sidebar.jsx`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/pages/student/Dashboard.jsx`
- `frontend/src/pages/admin/Dashboard.jsx`
- `frontend/src/pages/Placeholder.jsx`

---

### Phase 4 — Backend Setup + Auth + Connect Frontend

**What was built:**
- **Express server** with middleware stack: CORS → JSON parser → Cookie parser → Routes → Error handler
- **Prisma schema** with 7 models:
  - `User` (students + admins, role enum)
  - `Category` (9 CIPD lab categories)
  - `Item` (name, quantity, type, status, soft-delete)
  - `Request` (lifecycle: PENDING → APPROVED → ISSUED → RETURNED or DECLINED)
  - `RequestItem` (junction table: which items in which request)
  - `Transaction` (tracks physical issue/return of items)
  - `Notification` (alerts for request status changes)
- **Auth API routes:**
  - `POST /api/auth/signup` — register student (IIITD email only)
  - `POST /api/auth/login` — authenticate student or admin, returns JWT
  - `GET /api/auth/me` — restore session from saved token
  - `POST /api/auth/logout` — clear cookie
- **JWT middleware** — extracts token from `Authorization` header or cookie, verifies, attaches user to `req.user`
- **Admin authorization middleware** — checks `req.user.role === 'ADMIN'`
- **Error handler** — catches all errors, returns uniform `{ success, error: { message, code } }` format
- **Seed script** — creates admin user, test student, and 9 categories
- **Frontend wiring:**
  - `api.js` — Axios instance with request interceptor (attaches JWT) and response interceptor (auto-logout on 401)
  - Updated `AuthContext` to persist JWT in localStorage, restore session on page refresh via `/api/auth/me`
  - Login and Signup pages now call real API endpoints

**Key concepts introduced:**
- **Express middleware chain** — functions execute in order; each calls `next()` to pass control
- **Prisma ORM** — write `prisma.user.findUnique({ where: { email } })` instead of raw SQL
- **Prisma migrations** — `npx prisma migrate dev` generates SQL from schema changes and runs it
- **bcrypt** — hashes passwords with a salt (never store plain text passwords)
- **JWT (JSON Web Tokens)** — stateless authentication; server signs a token, client sends it back on every request
- **httpOnly cookies** — cookies the browser sends automatically but JavaScript cannot read (XSS protection)
- **Axios interceptors** — middleware for HTTP requests (add auth header) and responses (handle 401)

**Files created:**
- `backend/` project scaffold (package.json, .env)
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.js`
- `backend/src/index.js`
- `backend/src/routes/auth.js`
- `backend/src/middleware/auth.js`
- `backend/src/middleware/errorHandler.js`
- `backend/src/utils/jwt.js`
- `frontend/src/utils/api.js`

**Files modified:**
- `frontend/src/context/AuthContext.jsx` (added JWT persistence + session restore)
- `frontend/src/pages/Login.jsx` (wired to real API)
- `frontend/src/pages/Signup.jsx` (wired to real API)

---

### Phase 5 — Inventory Browsing (Categories + Items)

**What was built:**
- **Inventory API routes:**
  - `GET /api/inventory/categories` — all 9 categories with active item counts
  - `GET /api/inventory/categories/:id` — items in a category (with type filter + sort)
  - `GET /api/inventory/items/:id` — single item detail
  - `GET /api/inventory/search?q=arduino` — search items by name across all categories
- **Item seed script** (`seedItems.js`) — populates 105 items across all 9 categories based on the CIPD Inventory PDF
- **Student Inventory page** — responsive grid of 9 category cards with:
  - Unique icon and accent color per category
  - Item count from the API
  - Live search bar with debounced API calls (300ms delay)
  - Search results dropdown with item name, category, type badge, and quantity
- **Category Items page** — items within a single category:
  - Breadcrumb navigation (Inventory > Category Name)
  - Filter by type (All / Returnable / Consumable)
  - Sort by name or quantity (ascending/descending)
  - Desktop: full table (name, type badge, quantity, location, add to cart)
  - Mobile: card layout
  - Color-coded quantity (green = plenty, amber = low, red = out of stock)
  - "Add to Cart" buttons (wired in Phase 6)

**Key concepts introduced:**
- **Prisma `_count`** — `include: { _count: { select: { items: true } } }` generates an efficient `COUNT` subquery
- **Prisma `contains` + `mode: 'insensitive'`** — generates PostgreSQL `ILIKE` for case-insensitive search
- **Debounced search** — `setTimeout` + cleanup in `useEffect` prevents API calls on every keystroke
- **`useParams()`** — React Router hook that extracts URL parameters (`:categoryId` → `{ categoryId: "3" }`)
- **Conditional query params** — backend builds the Prisma `where` filter dynamically based on query string

**Files created:**
- `backend/src/routes/inventory.js`
- `backend/prisma/seedItems.js`
- `frontend/src/pages/student/Inventory.jsx`
- `frontend/src/pages/student/CategoryItems.jsx`

**Files modified:**
- `backend/src/index.js` (registered inventory routes)
- `frontend/src/App.jsx` (replaced Placeholder with real Inventory and CategoryItems)

---

## API Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| POST | `/api/auth/signup` | No | Register a new student account |
| POST | `/api/auth/login` | No | Login (returns JWT token) |
| GET | `/api/auth/me` | Yes | Get current user from token |
| POST | `/api/auth/logout` | No | Clear auth cookie |

### Inventory Routes (`/api/inventory`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/inventory/categories` | Yes | List all categories with item counts |
| GET | `/api/inventory/categories/:id` | Yes | Items in a category (supports `?type=`, `?sort=`, `?order=`) |
| GET | `/api/inventory/items/:id` | Yes | Single item full detail |
| GET | `/api/inventory/search?q=term` | Yes | Search items by name (min 2 chars) |

---

## Database Schema

```
User ──1:N──> Request ──1:N──> RequestItem <──N:1── Item ──N:1──> Category
                │
                └──1:1──> Transaction

User ──1:N──> Notification
```

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| User | name, email, password, role (ADMIN/STUDENT) | Authentication |
| Category | name | 9 inventory categories |
| Item | name, quantity, type, status, categoryId, deletedAt | Lab components |
| Request | reason, status, userId, collectionDeadline | Borrow requests |
| RequestItem | quantity, requestId, itemId | Items in a request |
| Transaction | issuedTo, professorName, issuedAt, returnedAt | Issue/return tracking |
| Notification | message, type, read, userId | Status change alerts |

---

## Routing Map

```
/                        → Redirect to /login
/login                   → Login page
/signup                  → Student registration

/student/                → Protected (STUDENT only)
  ├── dashboard          → Student home (stats, recent activity)
  ├── inventory          → Category grid + search
  ├── inventory/:id      → Items in a category
  ├── cart               → Shopping cart (Phase 6)
  ├── requests           → My requests history (Phase 6)
  └── profile            → User profile (Phase 9)

/admin/                  → Protected (ADMIN only)
  ├── dashboard          → Admin home (stats, pending requests, alerts)
  ├── inventory          → Full inventory management (Phase 8)
  ├── requests           → Approve/decline requests (Phase 7)
  ├── issued             → Currently issued items (Phase 8)
  └── add-item           → Add new item form (Phase 8)
```

---

## Upcoming Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 6 | Cart + Submit Borrow Request | Pending |
| 7 | Admin Request Management (approve/decline/issue) | Pending |
| 8 | Admin Inventory CRUD (add/edit/delete items) | Pending |
| 9 | User Profiles, Notifications, UI Polish | Pending |
| 10 | Google Sheets Sync (live sync with CIPD spreadsheet) | Pending |

---

## How to Update After Pulling Changes

```bash
# If database schema changed (new migration):
cd backend
npx prisma migrate dev
npx prisma generate

# If new seed data was added:
node prisma/seed.js
node prisma/seedItems.js

# If new packages were added:
cd backend && npm install
cd ../frontend && npm install

# If you want a completely fresh database:
cd backend
npx prisma migrate reset    # WARNING: deletes all data
node prisma/seed.js
node prisma/seedItems.js
```

---

## Running Both Servers

You need **two terminals** running simultaneously:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Output: CIPD IMS Backend running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Output: Local: http://localhost:5173
```

Open http://localhost:5173 in your browser. The Vite dev server proxies all `/api` requests to the backend automatically.
