# GrossTech Marketplace

A production B2B wholesale marketplace for daily essential goods (rice, sugar, oil, pulses, spices). Connects businesses buying in bulk with verified sellers, with escrow payments and full admin control.

---

## What This App Does

**Three user roles:**
- **Buyer** — browses products, adds to cart, pays via Razorpay, unlocks seller contact for ₹10
- **Seller** — registers with PAN/bank details, creates listings (pending admin approval), receives payouts after 3-day hold
- **Admin** — approves/rejects listings, releases payouts, views analytics, manages categories and items

**Core flows:**
1. Seller creates listing → Admin approves → Buyer sees it → Buyer pays → Payment held 3 days → Admin releases to seller
2. Buyer pays ₹10 → Seller phone/email revealed → Buyer contacts seller directly
3. OTP login via email or phone (2Factor.in API)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.7 — App Router, Server Components, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless), Prisma ORM v7 |
| Auth | NextAuth.js v4 — JWT strategy, CredentialsProvider (password + OTP) |
| Payments | Razorpay (orders, webhooks, contact unlock) |
| SMS OTP | [2Factor.in](https://2factor.in) |
| Email | Nodemailer (Gmail SMTP) |
| Image Storage | Vercel Blob (Cloudflare CDN) |
| Caching | Next.js `unstable_cache` with tag-based invalidation |
| Deployment | Vercel (auto-deploy on push to `main`) |

---

## Local Setup

### Prerequisites
- Node.js 20+
- Git

### Steps

```bash
git clone https://github.com/nischithramakrishnegowda/grosstech.git
cd grosstech
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000

### Environment Variables

Create `.env.local` — copy all values from Vercel Dashboard → Settings → Environment Variables:

```env
# Database (Neon)
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"   # always this for local dev

# Razorpay
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."

# Email (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASSWORD="your_gmail_app_password"    # Gmail App Password, not regular password
SMTP_FROM="GrossTech <your@gmail.com>"

# SMS OTP
TWOFACTOR_API_KEY="..."

# Image uploads (Vercel Blob)
BLOB_READ_WRITE_TOKEN="..."              # Vercel Dashboard → Storage → Blob

# Admin contact (shown in emails and footer)
ADMIN_EMAIL="admin@grosstech.in"
ADMIN_PHONE="+91XXXXXXXXXX"
```

**Getting Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords → create one named "GrossTech"

**Getting BLOB_READ_WRITE_TOKEN:** Vercel Dashboard → Storage tab → Create a Blob Store → copy the token

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@grosstech.com | admin123 |
| Seller | seller@grosstech.com | seller123 |
| Buyer | buyer@grosstech.com | buyer123 |

---

## Project Structure

```
grosstech/
├── prisma/
│   └── schema.prisma              # All DB models — single source of truth
│
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page (server component, cached)
│   │   ├── layout.tsx             # Root layout — font, Providers, NavigationProgress
│   │   ├── globals.css            # Tailwind + custom animations + brand color tokens
│   │   │
│   │   ├── login/                 # Password login + OTP login
│   │   ├── signup/                # Multi-field registration (PAN/bank for sellers)
│   │   ├── verify/                # Email + phone OTP verification after signup
│   │   ├── forgot-password/       # Password reset via OTP
│   │   │
│   │   ├── products/
│   │   │   ├── page.tsx           # Product listing (cached, search + filter + mode)
│   │   │   └── items/[slug]/      # Item detail — all seller listings for one item
│   │   │
│   │   ├── checkout/              # Cart + Razorpay payment + delivery address
│   │   ├── orders/                # Buyer order history
│   │   ├── buyer-requests/        # Post a buy request (visible to sellers/admin)
│   │   │
│   │   ├── seller/
│   │   │   ├── dashboard/         # Stats + recent listings
│   │   │   ├── listings/          # CRUD for seller's own listings
│   │   │   └── orders/            # Seller's incoming orders
│   │   │
│   │   ├── admin/
│   │   │   ├── dashboard/         # Revenue, order counts, pending alerts
│   │   │   ├── approvals/         # Review pending seller listings
│   │   │   ├── orders/            # All orders + set delivery charge
│   │   │   ├── analytics/         # Revenue breakdown, buyer stats
│   │   │   ├── items/             # Manage predefined item catalog
│   │   │   ├── inventory/         # Admin-sourced listings
│   │   │   ├── buyer-requests/    # View all buyer requests
│   │   │   └── contact-revenue/   # Revenue from contact unlocks
│   │   │
│   │   └── api/
│   │       ├── auth/              # register, send-otp, verify-otp, reset-password
│   │       ├── listings/          # Seller listing CRUD
│   │       ├── items/             # Item catalog (public read)
│   │       ├── products/          # Public product listing endpoint
│   │       ├── orders/            # Buyer order history
│   │       ├── buyer-requests/    # Create/list buy requests
│   │       ├── upload/            # Image upload → Vercel Blob → returns URL
│   │       ├── user/address/      # Prefill checkout address from profile
│   │       ├── seller/contact/    # Reveal seller contact after paid unlock
│   │       ├── payments/
│   │       │   ├── create-order/  # Create Razorpay order + internal DB records
│   │       │   ├── verify/        # Verify HMAC signature, mark PAYMENT_HELD
│   │       │   ├── webhook/       # Razorpay webhook (backup payment confirmation)
│   │       │   ├── update-status/ # Mark order FAILED/CANCELLED
│   │       │   └── contact-unlock/# Razorpay flow for contact reveal payment
│   │       └── admin/
│   │           ├── approvals/     # Approve or reject seller listings
│   │           ├── payouts/       # Release held payments to sellers
│   │           ├── analytics/     # Aggregated revenue/buyer stats
│   │           ├── orders/        # Set delivery charges
│   │           ├── categories/    # Manage categories
│   │           └── items/         # Manage predefined items
│   │
│   ├── components/
│   │   ├── landing/               # HeroSection, CategoriesSection, FeaturedProducts,
│   │   │                          # HowItWorks, AboutSection
│   │   ├── layout/                # Header (search + auth), Footer
│   │   ├── products/              # ItemCard, ItemDetailClient, ProductFilters,
│   │   │                          # ProductGridWrapper, ProductForm
│   │   ├── checkout/              # CheckoutClient — cart UI + Razorpay integration
│   │   ├── seller/                # SellerSidebar, SellerListingsTable
│   │   ├── admin/                 # AdminSidebar, ApprovalManager, PayoutManager,
│   │   │                          # CategoryManager, ItemManager
│   │   ├── buyer-requests/        # RequestList
│   │   ├── NavigationProgress.tsx # Thin green bar during page navigation
│   │   └── ui/                    # shadcn/ui base components + ImageUpload
│   │
│   ├── context/
│   │   └── CartContext.tsx        # Cart state — useReducer + localStorage, scoped per user
│   │
│   └── lib/
│       ├── auth.ts                # NextAuth options — JWT callbacks, OTP + password auth
│       ├── prisma.ts              # Prisma singleton with PrismaPg adapter for Neon
│       ├── cache.ts               # unstable_cache wrappers for all public DB queries
│       │                          # + invalidateTag() helper + CACHE_TAGS constants
│       ├── otp.ts                 # Generate/verify OTP codes, brute-force protection
│       ├── email.ts               # All transactional emails (order confirm, approval, etc.)
│       ├── sms.ts                 # sendOtpSms via 2Factor.in
│       ├── brand.ts               # Brand name, tagline, contact — change to rebrand
│       ├── razorpay.ts            # Razorpay client singleton
│       └── constants.ts           # PLATFORM_FEE=20, CONTACT_UNLOCK_FEE=10, PAYMENT_HOLD_DAYS=3
```

---

## Database Schema (Key Models)

```
User           — id, name, email, phone, role (BUYER/SELLER/ADMIN), address fields,
                 panNumber, gstNumber, accountNumber, ifscCode, upiId, declaration
Category       — id, name, slug, imageUrl
Item           — id, name, slug, imageUrl, categoryId  (predefined product catalog)
Listing        — id, name, brand, description, imageUrl, sellerId, itemId, categoryId,
                 status (PENDING_APPROVAL/APPROVED/REJECTED), isActive, source (ADMIN/SELLER)
PriceOption    — id, weight, price, stock, mode (RETAIL/BULK), minQty, listingId
Order          — id, buyerId, checkoutId, razorpayOrderId, status (PENDING/PAYMENT_HELD/
                 RELEASED_TO_SELLER/FAILED/CANCELLED), subtotal, platformFee, total,
                 shippingAddress, deliveryOption
OrderItem      — id, orderId, listingId, priceOptionId, quantity, priceAtOrder
OtpToken       — id, userId, code, type, channel, expiresAt, failedAttempts
ContactUnlock  — id, buyerId, sellerId, isPaid, razorpayOrderId
BuyerRequest   — id, buyerId, itemId, description, quantity
```

---

## Key Business Logic

| Feature | How it works |
|---|---|
| **Order splitting** | One Razorpay payment creates one DB `Order` per seller (all share `checkoutId`) |
| **Payment hold** | Orders sit in `PAYMENT_HELD` for 3 days (PAYMENT_HOLD_DAYS) before admin can release |
| **Platform fee** | Flat ₹20 per checkout. Charged to buyer, recorded on the order record |
| **Contact unlock** | Buyer pays ₹10 via Razorpay → `ContactUnlock.isPaid=true` → seller phone/email revealed |
| **Listing approval** | Seller creates listing → `PENDING_APPROVAL` → Admin approves → `APPROVED` + `isActive=true` |
| **Re-review on edit** | If seller edits an approved listing, it goes back to `PENDING_APPROVAL` automatically |
| **Bulk vs Retail** | Each `PriceOption` has a `mode` (BULK/RETAIL). Products page defaults to BULK (`?mode=RETAIL` switches) |
| **Stock check** | Server validates `stock >= quantity` and `quantity >= minQty` before creating order |
| **Image uploads** | Client compresses to 800px JPEG → POST /api/upload → Vercel Blob → URL stored in DB |
| **OTP brute force** | 5 wrong attempts locks the OTP token and forces a resend |
| **Caching** | Public pages (home, products, item detail) use `unstable_cache` with 30-60s TTL. Cache invalidated via tags on every mutation |

---

## Important Patterns

**Server components fetch directly from Prisma** — public pages don't go through API routes. API routes are only for client-side mutations.

**Cache invalidation** — whenever a listing/item/category is created, edited, or approved, `invalidateTag(CACHE_TAGS.items)` is called so cached pages refresh immediately.

**Image storage** — `imageUrl` in the DB is always a short CDN URL (Vercel Blob). Never a base64 string. The `/api/upload` endpoint handles the upload and returns the URL.

**Auth flow** — NextAuth JWT stores `id`, `role`, `phone` in the token. Role is checked in middleware (`src/middleware.ts`) for route protection. API routes re-check `getServerSession` for security.

**Multi-seller checkout** — if a cart has items from 3 sellers, one Razorpay order is created and 3 DB Orders are created sharing the same `razorpayOrderId` and `checkoutId`.

---

## Deployment

Push to `main` → Vercel auto-deploys.

```bash
git push origin main
```

After a schema change:
```bash
export $(grep -v '^#' .env | xargs) && npx prisma db push
# then push to git to trigger redeploy
```

---

## Planned / Not Yet Built

- Mobile app (React Native + Expo) — same backend API, new frontend
- AWS migration: Amplify (hosting) + RDS PostgreSQL (replaces Neon) + SES (replaces Gmail SMTP)
- Farmer seller type + individual buyer type (B2C expansion)
- Comprehensive agricultural product catalog with varieties
- S3 bucket for image uploads (replacing Vercel Blob when migrating to AWS)
