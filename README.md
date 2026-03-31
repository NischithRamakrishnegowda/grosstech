# Gross Tech Marketplace

A full-stack B2B marketplace for daily essential goods — rice, sugar, oil, pulses, spices. Connects buyers and sellers with Razorpay payments, a platform fee, and a full admin dashboard.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL on [Neon](https://neon.tech) + Prisma ORM v7 |
| Auth | NextAuth.js v4 — JWT, credentials (password + OTP) |
| Payments | Razorpay |
| SMS OTP | [2Factor.in](https://2factor.in) |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Vercel (frontend + API) |

---

## Fresh Setup (after OS reinstall)

### 1. Install prerequisites

- **Node.js 20+** — download from https://nodejs.org (use the LTS version)
- **Git** — `sudo apt install git` on Ubuntu/Debian

Verify:
```bash
node -v   # should print v20.x.x or higher
git -v
```

---

### 2. Clone the repo

```bash
git clone https://github.com/nischithramakrishnegowda/grosstech.git
cd grosstech
```

---

### 3. Install dependencies

```bash
npm install
```

---

### 4. Set up environment variables

Create a `.env.local` file in the project root. Copy every value from your **Vercel dashboard → Settings → Environment Variables**:

```env
# ─── Database (Neon) ──────────────────────────────────────────────
# Copy from: Vercel dashboard → Environment Variables → DATABASE_URL
DATABASE_URL="postgresql://..."

# ─── NextAuth ─────────────────────────────────────────────────────
# Copy from: Vercel dashboard → NEXTAUTH_SECRET
NEXTAUTH_SECRET="..."
# For local dev, always this value:
NEXTAUTH_URL="http://localhost:3000"

# ─── Razorpay ─────────────────────────────────────────────────────
# Copy from: Vercel dashboard → RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
# Set to "live" for real payments, "test" for test mode, "mock" to skip Razorpay entirely
RAZORPAY_MODE="live"
# Webhook secret (from Razorpay Dashboard → Webhooks) — optional for local dev
RAZORPAY_WEBHOOK_SECRET=""

# ─── Email (Gmail SMTP) ───────────────────────────────────────────
# Copy from: Vercel dashboard → SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASSWORD="your_gmail_app_password"
SMTP_FROM="GrossTech <your@gmail.com>"

# ─── Admin contact ────────────────────────────────────────────────
# Copy from: Vercel dashboard → ADMIN_EMAIL, ADMIN_PHONE
ADMIN_EMAIL="admin@..."
ADMIN_PHONE="+91XXXXXXXXXX"

# ─── SMS OTP (2Factor.in) ─────────────────────────────────────────
# Copy from: Vercel dashboard → TWOFACTOR_API_KEY
TWOFACTOR_API_KEY="..."
```

> **Note on `NEXTAUTH_URL`**: In Vercel it's set to your production URL (e.g. `https://grosstech.vercel.app`). For local dev, always override it to `http://localhost:3000` in `.env.local`.

> **Note on Gmail SMTP**: `SMTP_PASSWORD` is a Gmail **App Password**, not your regular Gmail password. If you lost it: Google Account → Security → 2-Step Verification → App Passwords → create a new one named "Grosstech".

---

### 5. Generate the Prisma client

The database schema is already migrated on Neon. You only need to generate the local Prisma client:

```bash
npx prisma generate
```

> You do **not** need to run `prisma migrate dev` — that's only for schema changes. The production DB on Neon is already up to date.

---

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

These accounts are seeded in the database:

| Role | Email | Password |
|---|---|---|
| Admin | admin@grosstech.com | admin123 |
| Seller | seller@grosstech.com | seller123 |
| Buyer | buyer@grosstech.com | buyer123 |

---

## Deploying to Vercel

The project is already connected to Vercel. To redeploy:

```bash
git push origin main   # Vercel auto-deploys on push to main
```

If you need to run schema migrations on the production DB:
```bash
npx prisma migrate deploy
```

---

## Making schema changes (Prisma)

If you modify `prisma/schema.prisma`:

```bash
# Create and apply a new migration locally + on Neon
npx prisma migrate dev --name describe-your-change

# Regenerate the Prisma client after any schema change
npx prisma generate
```

---

## Project Structure

```
grosstech/
├── prisma/
│   ├── schema.prisma          # Database models
│   ├── migrations/            # Migration history
│   └── seed.ts                # Demo data (admin/seller/buyer accounts)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page (server component)
│   │   ├── layout.tsx         # Root layout (font, providers)
│   │   ├── login/             # Login page (password + OTP)
│   │   ├── signup/            # Signup + email/phone verification
│   │   ├── products/          # Browse items, item detail page
│   │   ├── checkout/          # Cart checkout + Razorpay payment
│   │   ├── orders/            # Buyer order history
│   │   ├── seller/            # Seller dashboard (listings, orders)
│   │   ├── admin/             # Admin dashboard (approvals, payouts, analytics)
│   │   └── api/               # All API routes
│   │       ├── auth/          # register, send-otp, verify-otp, reset-password
│   │       ├── listings/      # CRUD for seller listings
│   │       ├── payments/      # Razorpay create-order, verify, contact-unlock
│   │       ├── admin/         # approvals, payouts, analytics, orders
│   │       └── seller/        # contact reveal after unlock
│   ├── components/
│   │   ├── landing/           # HeroSection, CategoriesSection, FeaturedProducts
│   │   ├── layout/            # Header, Footer
│   │   ├── products/          # ItemCard, ItemDetailClient, ProductFilters
│   │   ├── checkout/          # CheckoutClient (cart + Razorpay flow)
│   │   ├── seller/            # SellerSidebar, SellerListingsTable
│   │   ├── admin/             # PayoutManager, ApprovalManager, AdminSidebar
│   │   └── ui/                # shadcn/ui base components
│   ├── context/
│   │   └── CartContext.tsx    # Cart state — useReducer + localStorage per user
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config (JWT, credentials, OTP)
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── email.ts           # Nodemailer email helpers
│   │   └── constants.ts       # PLATFORM_FEE=20, CONTACT_UNLOCK_FEE=10
│   └── types/
│       └── index.ts           # NextAuth session type augmentation (adds role, phone)
├── .env.example               # Template — copy to .env.local and fill in values
└── package.json
```

---

## Key Business Logic

| Feature | How it works |
|---|---|
| **Order splitting** | One Razorpay payment → one DB `Order` per seller, all sharing a `checkoutId` |
| **Payment hold** | Orders sit in `PAYMENT_HELD` for 3 days before admin can release to seller |
| **Platform fee** | Flat ₹20 added to every checkout (stored on the order) |
| **Contact unlock** | Buyer pays ₹10 via Razorpay to reveal a seller's phone/email |
| **Listing approval** | All seller listings start as `PENDING_APPROVAL` — admin must approve before going live |
| **BULK default** | Product browsing defaults to BULK (wholesale) mode; `?mode=RETAIL` switches to retail |
| **minQty** | Bulk listings can have a minimum order quantity enforced in cart |
