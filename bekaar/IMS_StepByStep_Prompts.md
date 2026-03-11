# CIPD IMS — Step by Step Claude Code Prompts
# Start from Login → Dashboard → Everything else

---

## HOW TO USE
- Each STEP is one prompt to paste into Claude Code
- Wait for it to finish completely before pasting the next one
- At the end of each step you will see something working in the browser
- Steps 1–3 are pure frontend (no backend needed yet)
- Backend gets added from Step 4 onwards, side by side

---
---

# STEP 1 — Project Setup + Login Page (Frontend Only)

## What you will see after this step:
A beautiful login page at localhost:5173 with two options — Student and Admin login

---
## Paste this into Claude Code:

```
I am building a CIPD Lab Inventory Management System for IIITD college.
Start with the frontend only. No backend yet.

Tech: React + Vite + Tailwind CSS + React Router

=== SETUP ===
1. Create Vite React project in ~/IMS/frontend
2. Install: react-router-dom, tailwindcss, @tailwindcss/forms, axios
3. Set up Tailwind

=== BUILD THE LOGIN PAGE ===

Design direction: Clean, professional, institutional. 
Navy blue (#1a2744) and white. Subtle and trustworthy.
Font: use Google Font "DM Sans" for body, "Playfair Display" for headings.

Create src/pages/Login.jsx — this is the FIRST page users see:

Layout:
- Left half (60%): Big background with IIITD/CIPD branding
  * Dark navy background
  * Large text: "CIPD Lab" on top, "Inventory Management System" below
  * Small text: "IIITD — Indraprastha Institute of Information Technology Delhi"
  * Subtle grid or dot pattern in background for texture

- Right half (40%): White login card centered
  * At top: two toggle buttons — "Student" | "Admin"
  * Whichever is selected shows that login form
  * Both forms have: Email field, Password field, Login button
  * Student form also has: link below "New here? Create account"
  * Admin form: no signup link (admin accounts are pre-approved)
  * Show a small lock icon next to Admin toggle to indicate restricted
  * Smooth tab switch animation between Student and Admin

Behavior (no API calls yet, just UI):
- Clicking Login button: show a loading spinner for 1 second then show alert "Login coming in Step 4!"
- Clicking "Create account" link: navigate to /signup (we build that page in Step 2)

=== ROUTING ===
Set up React Router in App.jsx:
/ → /login (redirect)
/login → Login.jsx
/signup → placeholder page that just says "Signup page - coming soon"
/student/dashboard → placeholder that says "Student Dashboard - coming soon"
/admin/dashboard → placeholder that says "Admin Dashboard - coming soon"

=== AT THE END ===
Tell me:
- Exact command to start the dev server
- What I should see at localhost:5173
- Which file controls the colors so I can change them if I want
- Which file controls the fonts so I can change them if I want
```

---
---

# STEP 2 — Student Signup Page

## What you will see after this step:
A signup form at /signup with validation — shows errors for wrong email format etc.

---
## Paste this into Claude Code:

```
Continue building CIPD IMS frontend.

Build src/pages/Signup.jsx — Student signup page.

Design: Match the Login page exactly (same split layout, same colors, same fonts).
Left side same as login page.
Right side: signup form.

Form fields:
1. Full Name — required
2. Email — must end in @iiitd.ac.in, show error if it doesn't
3. Password — minimum 6 characters
4. Confirm Password — must match password field

Validation (frontend only, no API yet):
- All fields required — show red error text below each field if empty on submit
- Email format: if it doesn't end in @iiitd.ac.in show error: "Must be an IIITD email address"
- Password length: show error if less than 6 characters
- Confirm password: show error "Passwords do not match" if they differ
- If all valid: show green success message "Account created! Redirecting to login..." 
  then after 2 seconds navigate to /login

At the bottom of the form: "Already have an account? Login"

Also update Login.jsx:
- "Create account" link should now navigate to /signup
- After "Login" button click on Student tab: if email ends in @iiitd.ac.in navigate to /student/dashboard, else show error "Invalid credentials"
- After "Login" button click on Admin tab: if email is admin@cipd.iiitd.ac.in navigate to /admin/dashboard, else show error "Invalid credentials"
(This is just temporary frontend-only logic. Real auth comes in Step 4.)

Tell me:
- How the validation works
- Which part of the code handles the email check
- How to add a new allowed email domain if needed later
```

---
---

# STEP 3 — Dashboards (Student + Admin)

## What you will see after this step:
- Student dashboard at /student/dashboard with sidebar navigation
- Admin dashboard at /admin/dashboard with sidebar navigation
- Both with placeholder content but full layout ready

---
## Paste this into Claude Code:

```
Continue building CIPD IMS frontend.

Build the app shell and both dashboards. No API calls yet — use hardcoded dummy data.

=== APP SHELL (shared layout) ===

Create src/components/Layout.jsx — wraps all logged-in pages:
- Top navbar (fixed):
  * Left: "CIPD IMS" logo text
  * Right: user name + role badge + logout button
  * Navy blue background, white text

- Left sidebar (fixed, collapsible):
  * Width: 240px expanded, 60px collapsed
  * Collapse toggle button at bottom
  * Navigation links change based on role (student vs admin)
  
  STUDENT sidebar links:
  - 🏠 Dashboard
  - 📦 Browse Inventory
  - 🛒 My Cart (with item count badge)
  - 📋 My Requests
  - 👤 My Profile

  ADMIN sidebar links:
  - 🏠 Dashboard
  - 📦 Inventory
  - 📋 Requests
  - 🔄 Issued Items
  - ➕ Add Item

- Main content area: scrollable, takes remaining space

=== STUDENT DASHBOARD ===

Create src/pages/student/Dashboard.jsx

Use dummy data for now:

Top: "Good morning, Abhinav 👋" (hardcoded name for now)

4 stat cards in a row:
- 📋 Active Requests: 2
- 📦 Items With Me: 3
- ✅ Total Issued (all time): 7
- ⏰ Due Soon: 1

Below stats — two columns:

LEFT: "My Active Requests" 
- Show 2 dummy request cards:
  Card 1: "Arduino UNO x2, ESP32 x1" | Status: PENDING | Filed: Today
  Card 2: "Multimeter x1" | Status: APPROVED | Collect by: Tomorrow 5pm
- Each card has colored status badge

RIGHT: "Items Currently With Me"
- Show 2 dummy item rows:
  Row 1: NodeMCU x1 | Due: 3 days left | green
  Row 2: Soldering Iron x1 | Due: OVERDUE | red blinking dot

At bottom: big button "Browse Inventory →"

=== ADMIN DASHBOARD ===

Create src/pages/admin/Dashboard.jsx

Top: "Welcome back, Admin 👋"

4 stat cards:
- 📋 Pending Requests: 5
- 📦 Total Items: 105 (across all categories)
- 🔄 Currently Issued: 12
- ⚠️ Low Stock Alerts: 3

Below stats — two columns:

LEFT: "Pending Requests" (most urgent)
- 3 dummy request cards:
  Card 1: Harsh Kumar | Arduino UNO x2 | 2 hours ago
  Card 2: Bhawani Singh | DHT11 x3, Jumper Wires x20 | 5 hours ago
  Card 3: Abhinav Gupta | ESP32 x1 | Yesterday
- Each card: green Approve button + red Decline button

RIGHT: "Low Stock Alerts"
- 3 dummy items:
  ICM0C3021 — Only 1 left — red
  LoRA Module — Only 2 left — orange
  Analog PH Sensor — Only 2 left — orange
- Link: "View Full Inventory →"

=== ROUTING UPDATE ===
Wrap /student/* routes with Layout (student variant)
Wrap /admin/* routes with Layout (admin variant)
/logout → clears user, goes back to /login

Tell me:
- How to switch between student and admin view to test
- Which file I edit to change the sidebar links
- How the layout component knows which role to show
```

---
---

# STEP 4 — Backend Setup + Connect Login to Real Database

## What you will see after this step:
- A real Express server running at localhost:5000
- PostgreSQL database with tables created
- Login page actually talks to the backend
- Signup creates a real user in the database

---
## Paste this into Claude Code:

```
Now add the backend. Keep the frontend we built. Connect them together.

DATABASE already exists:
- Host: localhost
- DB: ims_db
- User: ims_user  
- Password: ims1234

=== BACKEND SETUP ===

1. Init Node project in ~/IMS/backend
2. Install: express, prisma, @prisma/client, dotenv, cors, bcrypt, jsonwebtoken
3. Create .env:
   DATABASE_URL=postgresql://ims_user:ims1234@localhost:5432/ims_db
   JWT_SECRET=cipd_ims_secret_2024
   PORT=5000

4. Create Express server src/index.js:
   - CORS: allow http://localhost:5173
   - JSON body parsing
   - GET /api/health → { status: "ok" }
   - Mount routes (we will add them below)

5. Write prisma/schema.prisma:

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(STUDENT)
  requests  Request[]
  createdAt DateTime @default(now())
}

enum Role { ADMIN STUDENT }

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  items Item[]
}

model Item {
  id            Int          @id @default(autoincrement())
  name          String
  quantity      Int          @default(0)
  rfid          String?
  purpose       Purpose      @default(ISSUE)
  purchaseDate  DateTime?
  receivingDate DateTime?
  vendorDetails String?
  costOfPurchase Float?
  billNo        String?
  status        ItemStatus   @default(ACTIVE)
  type          ItemType     @default(NA)
  location      String?
  category      Category     @relation(fields: [categoryId], references: [id])
  categoryId    Int
  requestItems  RequestItem[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum Purpose    { COURSE HACKATHON ISSUE }
enum ItemStatus { ACTIVE INACTIVE }
enum ItemType   { CONSUMABLE RETURNABLE NA }

model Request {
  id                 Int           @id @default(autoincrement())
  reason             String
  status             RequestStatus @default(PENDING)
  declineReason      String?
  collectionDeadline DateTime?
  user               User          @relation(fields: [userId], references: [id])
  userId             Int
  items              RequestItem[]
  transaction        Transaction?
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
}

enum RequestStatus { PENDING APPROVED DECLINED ISSUED RETURNED }

model RequestItem {
  id        Int     @id @default(autoincrement())
  quantity  Int
  request   Request @relation(fields: [requestId], references: [id])
  requestId Int
  item      Item    @relation(fields: [itemId], references: [id])
  itemId    Int
}

model Transaction {
  id                 Int      @id @default(autoincrement())
  issuedTo           String
  professorName      String?
  conditionOnIssue   String?
  conditionOnReturn  String?
  issuedAt           DateTime @default(now())
  expectedReturnAt   DateTime?
  returnedAt         DateTime?
  request            Request  @relation(fields: [requestId], references: [id])
  requestId          Int      @unique
  createdAt          DateTime @default(now())
}

6. Run: npx prisma migrate dev --name init

7. Create prisma/seed.js:
   - All 9 categories (exact names from CIPD inventory)
   - 1 admin user: name="CIPD Admin", email=admin@cipd.iiitd.ac.in, password hashed with bcrypt
   - 1 student: name="Test Student", email=test@iiitd.ac.in, password hashed with bcrypt

8. Run seed: node prisma/seed.js

=== AUTH ROUTES ===

Create src/routes/auth.js:

POST /api/auth/signup
- Body: { name, email, password }
- Validate: email ends in @iiitd.ac.in
- Check email not already taken
- Hash password with bcrypt (10 rounds) — explain what bcrypt rounds means
- Create user with role=STUDENT
- Return: { user: {id, name, email, role} } (no token yet)

POST /api/auth/student/login
- Body: { email, password }
- Find user by email, check role=STUDENT
- Compare password with bcrypt.compare
- Return: { user: {id, name, email, role} }

POST /api/auth/admin/login
- Same but checks role=ADMIN

Explain:
- What bcrypt does to the password
- Why we never store plain text passwords
- What bcrypt.compare does

=== CONNECT FRONTEND ===

Update src/pages/Login.jsx:
- Remove the hardcoded temporary logic from Step 2
- On Student login: call POST /api/auth/student/login
- On Admin login: call POST /api/auth/admin/login
- On success: save user to AuthContext, navigate to correct dashboard
- On fail: show the error message from API response

Update src/pages/Signup.jsx:
- Call POST /api/auth/signup on submit
- On success: navigate to /login with success message
- On fail: show error from API

Create src/context/AuthContext.jsx:
- Store: user object { id, name, email, role }
- login(userData): saves to state
- logout(): clears state, redirects to /login
- isAdmin(): returns true if role === ADMIN
- Explain: why we use Context here, and what happens to state on page refresh (it resets — we fix this in a later step)

Tell me:
- How to start both servers (two terminal commands)
- How to test login with Postman or Thunder Client
- What the database looks like now — command to check: psql -U ims_user -d ims_db -c "SELECT * FROM \"User\";"
- What error I will see if I enter wrong password
```

---
---

# STEP 5 — Inventory: Categories + Browse Items

## What you will see after this step:
- Real categories loaded from database on the home/inventory page
- Click a category → see real items from DB
- All 9 CIPD categories seeded with real items

---
## Paste this into Claude Code:

```
Continue CIPD IMS. Build frontend and backend together.

=== BACKEND ===

1. Create prisma/seedItems.js — seed ALL real CIPD items:

Basic Electronics: Capacitor Packet(1), SMD LEDs(5), Transistor(3), Potentiometer(3), General PCB Perf Boards(10), Sunboards(5)
Integrated Circuits: ICM0C3021(6), IC MCP4725(2)
Development Boards: Arduino UNO(20), NodeMCU(31), ESP32(19), NUCLEO-H753ZI(10), STM32-F401RE(25), STM32-G070RB(25), STM32-L152RE(10), STM32-W55RG(10)
Sensors & Modules: DHT11 Sensors(40), IR Sensors(45), IR RX(9), RFID Sensors(30), Soil Moisture Sensors(33), Analog TDS Sensor(2), Analog PH Sensor(2), Turbidity Sensor(2), RTC Module(2), LCD Screen(10), 3.5 inch TFT(2), SmartElex 6DOF(2)
Communication & RF: LoRA Module(2), BLE(4), I2C(2), Channel Remote A(2), Channel Remote B(2)
Power Supply: 18650 Battery(10), AAA Cells(6), Adapters(30), Battery Holder 2S(7), Battery Holder 3S(5), DC 12V Solenoid(2)
Tools & Equipment: Screwdrivers(30), Big Screwdriver Set(1), Mobile Screwdriver Kit(1), Cutters(4), Wire Strippers(1), Pluckers(3), Drill Machine(1), Makita Blade Set(1), Continuity Testers(2), Multimeter Large(2), Multimeter Medium(2), Multimeter Small(2), Soldering Iron(4), Soldering Stands(4), Soldering Helping Hands(2), Iron Tips(5), Desoldering Pumps(4), Soldering Mats(4), Paint Brush(3), Pencil Cutters(2)
Cables & Connectors: Header Pin(1), Male+Female Headers(1), 4-Core Wire(2), Black Wire(1), Blue Wire(1), Red Wire(2), Copper Wire Roll(1), Arduino Wires Blue(25), Jumper Wires(1500), B-Type Cables(36), DC Jacks(30), C-Type Jack(3), Switch Boxes(30), Switches(60)
Mechanical/Robotics: 8 Inch Wheels(8), Wheels Black(111), Free Wheels(60), Motors 150RPM(71), Johnson Motors 300RPM(8), Motor Drivers(21), Motor Clamps(6), ESC 20D(1), Chassis(29), Breadboards(89), Plastic Boxes(30), Black Tapes(30), Double-Sided Tapes(36), ST Link Programmer(4), Ring Lights(2), Stands for Ring Lights(4), Chairs(8), Soccer Arena(3)

Set type=RETURNABLE for: all Development Boards, all Tools & Equipment, Drill Machine, Multimeters, Soldering Iron
Set type=CONSUMABLE for: all Cables, Batteries, Capacitors, LEDs, Transistors, Wire bundles, Tapes, Glue
Set type=NA for everything else

2. Create src/routes/inventory.js:

GET /api/categories
- Returns all categories with itemCount for each

GET /api/categories/:id
- Returns category + all its items

GET /api/items
- Returns all items
- Query params: ?categoryId= ?type= ?status= ?search=
- Each item includes category name

GET /api/items/:id
- Full item details

=== FRONTEND ===

Update src/pages/student/Dashboard.jsx:
- Replace hardcoded stats with real API calls
- Fetch GET /api/categories → show real category count
- Fetch GET /api/items → show real item count

Create src/pages/Inventory.jsx (student view):
Route: /student/inventory

Layout:
- Top: "Browse Inventory" heading + search bar
- Below: 9 category cards in a 3x3 grid
  Each card:
  * Category name
  * Item count (e.g. "8 items")
  * Small icon or color accent per category
  * Hover effect: slight lift + shadow
  * Click → goes to /student/inventory/:categoryId

Create src/pages/CategoryItems.jsx:
Route: /student/inventory/:categoryId

Layout:
- Breadcrumb: Inventory > [Category Name]
- Category name as page heading
- Item count subtitle: "8 items available"
- Items in a clean table or card grid:
  Each item shows:
  * Item name
  * Available quantity (large number)
  * Type badge: green pill "Consumable" / blue pill "Returnable" / gray "NA"
  * Status badge: green "Active" / red "Inactive"
  * If quantity = 0: show "Out of Stock" in red, disable add to cart
  * "Add to Cart" button (we wire this up in Step 6)

- Back button to /student/inventory

Tell me:
- How to run the item seed: node prisma/seedItems.js
- How to verify items in DB: psql query
- How the search filter works on GET /api/items
- How type and status badges are styled — which file to edit to change badge colors
```

---
---

# STEP 6 — Cart + Submit Request

## What you will see after this step:
- Add items to cart from category page
- Cart icon in navbar shows live count
- Submit cart as a request → saved in database
- Student can see their submitted requests

---
## Paste this into Claude Code:

```
Continue CIPD IMS. Build frontend and backend together.

=== BACKEND ===

Create src/routes/requests.js:

POST /api/requests
- Body: { userId, items: [{itemId, quantity}], reason }
- Validate each item: does it exist? Is requested qty <= available qty?
- If any item fails: return error listing which items have insufficient stock
- Create Request (status=PENDING) + RequestItems
- Do NOT change item quantities yet (that happens when admin marks ISSUED)
- Return full request with items

GET /api/requests/mine
- Query param: ?userId=
- Returns all requests for that student
- Each request includes: items list with names, status, createdAt, declineReason

=== FRONTEND ===

Create src/context/CartContext.jsx:
- Cart state: array of { item: {id, name, type, quantity}, requestedQty }
- addToCart(item, qty): adds or updates item in cart
- removeFromCart(itemId): removes item
- updateQty(itemId, newQty): changes quantity
- clearCart(): empties cart
- cartTotal: total number of items across all entries
- Explain: why we keep cart in Context (so it persists across page navigation)

Update src/components/Layout.jsx navbar:
- Cart icon (🛒) with red badge showing cartTotal
- Clicking icon opens CartSidebar

Create src/components/CartSidebar.jsx:
- Slide-in panel from right side (use CSS transition)
- Overlay darkens background when open
- Close button (X) top right

Inside sidebar:
- Header: "My Cart (3 items)"
- List of cart items:
  Each row: item name | qty selector (- / number / +) | remove button (×)
  Qty selector: cannot go below 1 or above item's available stock
- Divider
- "Reason for Issue" textarea (required)
- Character count below textarea
- Submit button: "Submit Request →"
- On submit:
  * Validate reason is not empty
  * Call POST /api/requests with logged in user's id
  * On success: show green "Request submitted!" inside sidebar, clear cart, close after 2 seconds
  * On fail: show error in red

Update CategoryItems.jsx:
- "Add to Cart" button on each item
- Clicking opens a small inline quantity picker (shows under the button)
- Confirm: adds to cart, button changes to "✓ In Cart" (green)
- If already in cart: button shows "✓ In Cart", clicking again opens cart sidebar

Create src/pages/student/MyRequests.jsx:
Route: /student/requests

Layout:
- Page heading: "My Requests"
- Filter tabs: All | Pending | Approved | Issued | Declined | Returned

Each request card:
- Date filed (e.g. "2 hours ago")
- Items list: "Arduino UNO ×2, ESP32 ×1, DHT11 ×3"
- Reason (collapsed, "show more" if long)
- Status badge (colored)
- PENDING: yellow badge
- APPROVED: green badge + "Collect by [deadline]" countdown
- ISSUED: blue badge + "Return by [date]"
- DECLINED: red badge + red box below showing decline reason
- RETURNED: gray badge + return date

Tell me:
- How CartContext persists across pages
- What happens in DB when request submitted — show me the SQL to verify
- How the qty validation works (can't request more than available)
- How to test the full flow: add items → submit → check DB
```

---
---

# STEP 7 — Admin: View & Manage Requests

## What you will see after this step:
- Admin sees all pending requests
- Admin can approve or decline with a reason
- Admin can mark items as physically collected (Issued)
- Item quantities change in the database at correct moments

---
## Paste this into Claude Code:

```
Continue CIPD IMS. Build frontend and backend together.

=== BACKEND ===

Add to src/routes/requests.js:

GET /api/requests/all (admin only — no auth check yet)
- Returns all requests sorted by createdAt desc
- Each request includes: student name, email, items with names and quantities, status

PUT /api/requests/:id/approve
- PENDING → APPROVED
- Set collectionDeadline = now + 24 hours
- Return updated request

PUT /api/requests/:id/decline
- Body: { declineReason }
- PENDING → DECLINED
- Save declineReason
- Return updated request

PUT /api/requests/:id/issued
- APPROVED → ISSUED
- For each RequestItem: item.quantity -= requestItem.quantity
- Create Transaction: { requestId, issuedTo: student name, issuedAt: now, expectedReturnAt: now + 7 days }
- Return updated request + transaction

PUT /api/requests/:id/returned
- Body: { conditionOnReturn }
- Find Transaction for this request
- Set returnedAt = now, set conditionOnReturn
- For each RequestItem: item.quantity += requestItem.quantity (restore stock)
- ISSUED → RETURNED
- Return updated transaction

GET /api/transactions/active
- Returns all transactions where returnedAt is null
- Include: item names, student info, issue date, expected return, isOverdue flag

=== FRONTEND ===

Create src/pages/admin/Requests.jsx:
Route: /admin/requests

Layout:
- Page heading: "Requests"
- Tabs: Pending (with count badge) | Approved | Issued | Declined | All
- Auto-refresh every 30 seconds (so admin sees new requests without refreshing)

PENDING tab:
Each request card shows:
- Student name + email in header
- Item list: each item on its own line with qty
- Reason for issue in italic
- Time filed: "Filed 2 hours ago"
- Two action buttons:
  * Green "✓ Approve" 
  * Red "✗ Decline"

APPROVED tab:
Each card shows same info plus:
- Green "Collection deadline: [time remaining]" countdown
- Blue "Mark as Collected / Issued" button

ISSUED tab:
Each card shows:
- Who has it + issue date
- "Expected return: [date]" — red if overdue
- Green "Mark as Returned" button

DECLINED tab:
Each card shows decline reason in a red box

Create src/components/DeclineModal.jsx:
- Opens when admin clicks Decline
- Textarea: "Reason for declining this request"
- Cancel + "Confirm Decline" buttons
- Validate reason is not empty

Create src/components/ReturnConfirmModal.jsx:
- Opens when admin clicks Mark as Returned
- Dropdown: Item condition → Good / Minor Damage / Damaged / Lost
- "Confirm Return" button
- On confirm: calls PUT /api/requests/:id/returned

Update admin Dashboard.jsx:
- Pending Requests count: fetch real data
- Approve and Decline buttons on dashboard cards call real API

Tell me:
- Exactly when quantities change (approve vs issued — show difference)
- How to verify quantity change in DB: SELECT name, quantity FROM "Item" WHERE name='Arduino UNO';
- How the 30 second auto refresh works and how to turn it off
- What happens if admin tries to mark as issued after collection deadline passed
```

---
---

# STEP 8 — Admin: Full Inventory Management

## What you will see after this step:
- Admin can see the full inventory with all details
- Admin can add a new item with a step-by-step form
- Admin can edit existing items
- Admin can see currently issued items and mark returns

---
## Paste into Claude Code:

```
Continue CIPD IMS. Build frontend and backend together.

=== BACKEND ===

Add to inventory routes:

POST /api/items
- Body: all item fields
- Required: name, categoryId, quantity, type, status, purpose, location
- Optional: rfid, vendorDetails, costOfPurchase, billNo, purchaseDate, receivingDate
- Return created item with category name

PUT /api/items/:id
- Body: any subset of fields to update
- Return updated item

DELETE /api/items/:id
- Soft delete: add a deletedAt field to Item model, set it to now
- Don't actually remove from DB
- GET /api/items should exclude deleted items

GET /api/inventory/summary
- Returns:
  totalItems (not deleted)
  totalCategories: 9
  totalIssued: count of active transactions
  lowStock: items where quantity < 5, sorted by quantity asc

=== FRONTEND ===

Create src/pages/admin/Inventory.jsx:
Route: /admin/inventory

Layout:
- Top bar: "Inventory" heading + "Add New Item" button (blue)
- Filter row: Category dropdown | Type | Status | Search by name
- Full table below

Table columns:
Name | Category | Total Qty | Type | Status | Purpose | Location | RFID | Actions

- Type, Status shown as colored badges
- If quantity < 5: show qty in red with ⚠️ icon
- If quantity = 0: entire row has light red background
- Actions column: Edit icon (pencil) + Delete icon (trash)
- Delete: show confirm dialog "Delete [item name]? This cannot be undone."
- Clicking item name: opens a detail side panel (slides from right)

Create src/components/AddItemDrawer.jsx:
- Slides in from right side (not a modal, a drawer)
- Step progress bar at top: Step 1 of 4

Step 1 — Basic Info:
- Category (dropdown — loads from GET /api/categories)
- Item Name (text)
- Type: three big toggle buttons: Consumable | Returnable | NA

Step 2 — Quantity & Status:
- Quantity (number input)
- Status: toggle Active / Inactive
  * Explain to user: "Active = available for issue, Inactive = stored away"
- Purpose: three toggle buttons: Course | Hackathon | Issue

Step 3 — Location & RFID:
- Location in lab (text, e.g. "Shelf 3, Cabinet B")
- RFID tag (optional text input)
  * "No RFID" checkbox to skip

Step 4 — Purchase Details (all optional):
- Vendor name
- Bill number
- Cost per unit
- Purchase date (date picker)
- Receiving date (date picker)

Bottom: Back | Next buttons, Submit on last step
On submit: POST /api/items, close drawer, refresh list

Edit: same drawer but pre-filled, uses PUT /api/items/:id

Create src/pages/admin/IssuedItems.jsx:
Route: /admin/issued

Table:
Item Name | Qty | Issued To | Issue Date | Expected Return | Status | Action

- Overdue rows: light red background + "OVERDUE" badge
- Due today: yellow background + "Due Today" badge
- Action: "Mark Returned" button

Tell me:
- How soft delete works and how to restore a deleted item if needed
- How the step form saves progress between steps
- Which field makes something show as "overdue"
- How to add a new category if needed
```

---
---

# STEP 9 — Profiles, Notifications & Polish

## What you will see after this step:
- Student profile page with issued item history
- Notification alerts when request is approved/declined
- Re-issue button on previously returned items
- App feels complete and polished

---
## Paste into Claude Code:

```
Continue CIPD IMS. Final features before Google Sheets sync.

=== BACKEND ===

GET /api/profile/:userId
- Returns: user info + active requests + currently issued items + past issued items

GET /api/notifications/:userId
- Returns recent status changes on user's requests
- e.g. "Your request for Arduino UNO was approved" 
- "Your request for ESP32 was declined: Insufficient reason provided"

POST /api/requests/:id/reissue
- Student re-requests a previously returned item
- Creates a new Request with same items
- Status: PENDING

=== FRONTEND ===

Create src/pages/student/Profile.jsx:
Route: /student/profile

Sections:
1. User info card: name, email, role badge, member since date

2. "Currently Issued Items" table:
   Item | Qty | Issue Date | Return By | Days Left
   - Color code Days Left: green > 3 days, orange 1-3 days, red overdue

3. "Previously Issued Items" table:
   Item | Qty | Issue Date | Returned On | Condition
   - "Re-issue" button on each row
   - Re-issue calls POST /api/requests/:id/reissue
   - Show success toast "Re-issue request submitted!"

4. "My Request History" — collapsible section
   All past requests with status badges

Create src/components/NotificationBell.jsx:
- Bell icon in navbar
- Red dot when unread notifications exist
- Click opens dropdown showing last 5 notifications
- Each notification: message + time ago + colored dot (green=approved, red=declined)

=== POLISH THE WHOLE APP ===

1. Add loading skeletons (gray animated placeholder blocks) on every page while data loads
   - Explain what a skeleton loader is and why it's better than a spinner for dashboards

2. Add toast notifications (bottom right corner):
   - Green toast: "Request submitted successfully"
   - Red toast: "Failed to load items. Please try again."
   - Auto-dismiss after 3 seconds

3. Empty states on every list:
   - No requests yet: illustration + "No requests yet. Browse inventory to get started →" button
   - No items in category: "This category has no items yet"
   - No issued items: "Nothing currently issued"

4. Make the app mobile responsive:
   - Sidebar collapses to bottom tab bar on small screens
   - Tables become card stacks on mobile
   - Cart sidebar takes full width on mobile

Tell me:
- How the re-issue flow works
- How notifications are generated (are they stored in DB or computed?)
- How to add a new notification type
- How to test mobile view in browser
```

---
---

# STEP 10 — Google Sheets Sync

## What you will see after this step:
- Every DB change reflects in Google Sheet automatically
- 4 sheet tabs: Inventory, Currently Issued, Requests, History
- One-time import from existing sheet to DB

---
## Paste into Claude Code:

```
Continue CIPD IMS. Add Google Sheets real-time sync.

Before writing code, explain step by step:
1. What a Google Service Account is (explain like I am new to this)
2. How to create one on Google Cloud Console — list every click
3. What the downloaded JSON file contains
4. How to share the Google Sheet with the service account email
5. How to find the Sheet ID in the URL

Then add to .env:
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SHEET_ID=your_sheet_id_here

Install: npm install googleapis

Create src/utils/sheetsSync.js with 4 functions:

syncInventorySheet(prisma):
- Tab name: "Inventory"
- Header: RFID | Item Name | Category | Quantity | Type | Status | Purpose | Location | Vendor | Cost | Bill No | Purchase Date | Receiving Date | Last Updated
- Fetch all items, write all rows, clear old data first

syncIssuedSheet(prisma):
- Tab name: "Currently Issued"  
- Header: Item Name | Qty | Issued To | Email | Issue Date | Expected Return | Overdue
- Fetch all active transactions

syncRequestsSheet(prisma):
- Tab name: "Requests"
- Header: Student | Email | Items | Reason | Filed At | Status | Decline Reason
- Fetch last 50 requests

syncHistorySheet(prisma):
- Tab name: "History"
- Header: Item | Qty | Issued To | Issue Date | Returned On | Condition
- Fetch all returned transactions

Call syncs after:
- POST /api/items → syncInventorySheet
- PUT /api/items/:id → syncInventorySheet
- PUT /api/requests/:id/issued → syncIssuedSheet + syncRequestsSheet
- PUT /api/requests/:id/returned → syncIssuedSheet + syncHistorySheet + syncInventorySheet

Also create src/utils/importFromSheet.js:
- Reads existing Inventory sheet data
- Maps columns to DB fields
- Creates items that don't exist yet (match by name)
- Run once with: node src/utils/importFromSheet.js

Tell me:
- Every step to set up Google Cloud (I will follow along)
- How to test that sync works
- How to check the sheet was updated
- What happens if Google API is down — does our app crash?
- How to run the one-time import
```

---
---

## WHAT TO DO IF SOMETHING BREAKS

Paste this into Claude Code:
```
This error occurred in CIPD IMS: [paste error here]
The step I was on: [Step number]
File where error is: [filename if you know]
Fix it and explain what caused it.
```

## QUICK REFERENCE — Commands

```bash
# Start backend
cd ~/IMS/backend && node src/index.js

# Start frontend  
cd ~/IMS/frontend && npm run dev

# Check DB tables
psql -U ims_user -d ims_db -c "\dt"

# Check items in DB
psql -U ims_user -d ims_db -c "SELECT name, quantity FROM \"Item\" LIMIT 10;"

# Check users
psql -U ims_user -d ims_db -c "SELECT name, email, role FROM \"User\";"

# Reset DB completely
cd ~/IMS/backend && npx prisma migrate reset
```
