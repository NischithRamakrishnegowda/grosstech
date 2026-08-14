# GrossTech Marketplace

A production B2B wholesale marketplace for daily essential goods — rice, sugar, oil, pulses, spices. Connects businesses buying in bulk with verified sellers, with escrow payments, admin approval workflow, and a full seller/buyer/admin dashboard.

---

## What This App Does

Three user roles with distinct flows:

**Buyer** — registers, browses products (bulk/retail), adds to cart, pays via Razorpay, receives confirmation email, can unlock seller contact for ₹10 (free if they've already purchased from that seller), posts buy requests, tracks order history.

**Seller** — registers with PAN + bank details, creates product listings (goes to admin approval), receives orders, sees expected payout date, gets paid after 3-day hold, can edit and resubmit rejected listings.

**Admin** — approves/rejects seller listings (emails seller), manages product catalog (categories + items), sets delivery charges, releases seller payouts, views analytics, can remove seller listings with reason, sees buyer contact details on buy requests.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.7 — App Router, Server Components, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless), Prisma ORM v7 |
| Auth | NextAuth.js v4 — JWT strategy, CredentialsProvider (password + OTP) |
| Payments | Razorpay (orders, webhooks, contact unlock, payout tracking) |
| SMS OTP | [2Factor.in](https://2factor.in) — `TWOFACTOR_API_KEY` |
| Email | Nodemailer via Gmail SMTP |
| Image Storage | Vercel Blob (Cloudflare CDN) — `BLOB_READ_WRITE_TOKEN` |
| Caching | Next.js `unstable_cache` with tag-based on-demand invalidation |
| Deployment | Vercel (auto-deploy on push to `main`) |

---

## Local Setup

### Prerequisites
- Node.js 20+
- Git

```bash
git clone https://github.com/nischithramakrishnegowda/grosstech.git
cd grosstech
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000

### Environment Variables (`.env.local`)

```env
# Database (Neon PostgreSQL)
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
SMTP_PASSWORD="your_gmail_app_password"   # Gmail App Password, not regular password
SMTP_FROM="GrossTech <your@gmail.com>"

# SMS OTP
TWOFACTOR_API_KEY="..."

# Image uploads (Vercel Blob)
BLOB_READ_WRITE_TOKEN="..."              # Vercel Dashboard → Storage → Blob

# Admin contact (shown in emails and footer)
ADMIN_EMAIL="admin@grosstech.in"
ADMIN_PHONE="+91XXXXXXXXXX"
```

**Gmail App Password:** Google Account → Security → 2-Step Verification → App Passwords → create one named "GrossTech"

**Vercel Blob token:** Vercel Dashboard → Storage tab → Create Blob Store → copy `BLOB_READ_WRITE_TOKEN`

---

## ⚠️ Testing Flags — Change Before Go-Live

```ts
// src/lib/constants.ts
PLATFORM_FEE = 1          // TODO: change back to 20
CONTACT_UNLOCK_FEE = 1    // TODO: change back to 10
PAYMENT_HOLD_DAYS = 3     // keep at 3
```

---

## Demo / Admin Account

| Role | Email | Notes |
|---|---|---|
| Admin | loftettrading2021@gmail.com | Only account in DB — use forgot password if needed |

Buyer and seller accounts are registered fresh via the signup flow. No demo credentials — clean state.

---

## Database Schema

### Enums
```
Role:          BUYER | SELLER | ADMIN
OrderStatus:   PENDING | PAYMENT_HELD | RELEASED_TO_SELLER | FAILED | CANCELLED
ListingSource: ADMIN | SELLER
ListingStatus: PENDING_APPROVAL | APPROVED | REJECTED
PriceMode:     RETAIL | BULK
OtpType:       EMAIL_VERIFY | PHONE_VERIFY | PASSWORD_RESET | LOGIN_OTP
OtpChannel:    EMAIL | PHONE
```

### Models

**User** — id, name, email (unique), password (hashed), phone, role, profileImageUrl, businessName, street, city, state, pincode, upiId, accountNumber, ifscCode, panNumber, gstNumber, declaration, emailVerified, phoneVerified, createdAt, updatedAt
→ Index: role

**Category** — id, name (unique), slug (unique), imageUrl, createdAt
→ No image in practice — uses Lucide icons in the UI. DB field kept for future use.

**Item** — id, name, slug (unique), imageUrl, categoryId, createdAt
→ Admin uploads images via Admin → Items panel → Vercel Blob
→ Index: (via FK categoryId)

**Listing** — id, name, brand, description, imageUrl, source (ADMIN/SELLER), isActive, status, rejectionReason, categoryId, sellerId, itemId, createdAt, updatedAt
→ Seller listings: source=SELLER, start as PENDING_APPROVAL, isActive=false
→ Admin listings: source=ADMIN, APPROVED, isActive=true
→ Indexes: (status, isActive), categoryId, sellerId, itemId

**PriceOption** — id, weight (e.g. "1kg"), price, stock, mode (RETAIL/BULK), minQty (default 1), listingId
→ onDelete: Cascade from Listing

**Order** — id, checkoutId (shared across split orders), razorpayOrderId, razorpayPaymentId, razorpaySignature, buyerId, subtotal, platformFee, total, status, paymentCapturedAt, releaseScheduledAt, releasedAt, shippingAddress, shippingPhone, secondaryPhone, deliveryOption (SELF_PICKUP/DELIVERY), deliveryCharge, createdAt, updatedAt
→ Indexes: buyerId, status

**OrderItem** — id, quantity, priceAtOrder, orderId, listingId, priceOptionId
→ Indexes: orderId, listingId

**OtpToken** — id, userId, code (6-digit), verifiedToken, type, channel, expiresAt, usedAt, failedAttempts (brute force protection — locks after 5 wrong attempts), createdAt
→ Indexes: userId, verifiedToken

**ContactUnlock** — id, razorpayOrderId, razorpayPaymentId, fee, isPaid, buyerId, sellerId, unlockedAt, createdAt
→ Unique: (buyerId, sellerId) — one unlock per buyer-seller pair
→ Indexes: buyerId, sellerId

**BuyerRequest** — id, description, quantity, isResolved, resolvedAt, buyerId, itemId, createdAt, updatedAt
→ Indexes: buyerId, itemId

---

## Full Feature List

### Authentication
- Email + password login
- OTP login via email or phone (2Factor.in)
- Email + phone verification after signup (both required)
- Forgot password via OTP
- OTP brute force protection: 5 wrong attempts locks the token, forces resend
- Session: JWT with `id`, `role`, `phone` stored

### Registration
- **Buyer**: name, email, phone, password, address (pincode auto-fills city/state via India Post API)
- **Seller**: same + business name, PAN (mandatory, validated), bank account + IFSC (mandatory), UPI (optional), GST (optional), declaration (optional)
- **Admin**: cannot self-register — role set directly in DB

### Product Catalog
- Admin creates **Categories** (name + slug, icon shown in UI — no image needed)
- Admin creates **Items** under categories (name, slug, optional image → Vercel Blob)
- Sellers create **Listings** under items (name, brand, description, image, price options)
- Each listing can have multiple **PriceOptions**: weight, price, stock, mode (RETAIL/BULK), minQty
- Listing image shown on item detail page per seller card (allows brand differentiation)
- Item image shown on product cards and item detail header (canonical product photo)

### Listing Approval Workflow
- Seller creates listing → status: `PENDING_APPROVAL`, isActive: false
- Admin reviews in **Approvals** page → approve or reject with reason
- Approved → status: `APPROVED`, isActive: true, seller gets email
- Rejected → status: `REJECTED`, isActive: false, seller gets email with reason and "Action needed" subject (avoids spam filters)
- Seller edits rejected listing → goes back to `PENDING_APPROVAL` automatically
- Seller edits **approved** listing → also goes back to `PENDING_APPROVAL` (re-review required)
- Admin can **remove** any seller listing from Inventory with a reason → email sent to seller
- Admin can only **edit** their own (ADMIN-sourced) listings

### Product Browsing
- Products page defaults to **BULK** mode (wholesale first — B2B app)
- Toggle between Bulk/Retail
- Filter by category, search by name, filter by price range
- Category navigation: horizontal scroll on mobile, grid on desktop
- Item detail shows all sellers listing that item, with their brand photo and prices
- Auto-selects available mode — if item only has retail, opens retail (no "not available" screen)

### Cart & Checkout
- Cart persists per user in localStorage (scoped to user ID)
- Stock validated server-side before order creation
- minQty enforced server-side
- Delivery options: Self Pickup or Delivery (charge set by admin after order)
- Platform fee: ₹20 (currently ₹1 for testing)
- One Razorpay payment → one DB Order per seller (split checkout via `checkoutId`)
- After payment: cart cleared silently, redirect to success page (no empty cart flash)

### Order & Payment Flow
1. Buyer pays → Razorpay order created
2. Payment verified (HMAC-SHA256) → Orders set to `PAYMENT_HELD`
3. Stock decremented for all items
4. Emails sent: buyer confirmation (with seller contacts for fulfilled items), seller notification, admin notification
5. After 3 days (`releaseScheduledAt`) → admin can release to seller
6. Admin releases → `RELEASED_TO_SELLER`
7. Razorpay webhook as backup (handles cases where client verification fails)

### Contact Unlock
- Buyer on item detail page sees blurred seller contact
- Pays ₹10 (currently ₹1) → Razorpay → contact revealed
- **Free if buyer has already purchased from that seller** (checks `PAYMENT_HELD` or `RELEASED_TO_SELLER` orders)
- One payment per seller across all items (not per listing)
- Contact shown immediately on UI after payment
- Label: "Previous Purchase" (if via order) or "Contact Unlocked" (if paid)
- Contact details also included in buyer order confirmation email for sellers in that order

### Buy Requests
- Buyers post what they need (description, optional quantity, optional item)
- Visible to: buyer (own requests only), sellers (all), admin (all + buyer contact details)
- Admin and sellers can mark requests as **Resolved** or **Open**
- Unresolved requests sort to top
- Resolved requests shown at 60% opacity

### Profile & Settings
- All users can edit: name, phone, address (with pincode auto-fill), profile photo
- Sellers additionally: business name, PAN, bank account, IFSC, UPI, GST
- Profile photo: uploaded to Vercel Blob via camera icon on profile page
- Change password: requires current password verification
- Email is read-only (identity field)

### Auto-Refresh (Live Data)
Pages silently refresh server data using `router.refresh()` — no visible reload:
- Admin approvals: every 20s
- Admin orders: every 30s
- Admin dashboard: every 60s
- Seller listings: every 20s
- Seller orders: every 20s
- Seller dashboard: every 30s
- Buyer orders: every 30s
- Buyer requests: every 30s

### Caching (Performance)
All public pages use `unstable_cache` — DB is hit once, then cache serves requests:
- Home page: 60s revalidate
- Products page: 30s revalidate
- Item detail: 60s revalidate + static generation at build time for known items
- Cache is **immediately invalidated** when admin approves/rejects/adds/edits anything via `invalidateTag()`

### Email Notifications
All emails avoid spam-trigger words (no "OTP", "rejected", "not approved"):

| Event | Recipient | Subject pattern |
|---|---|---|
| Email verification after signup | Buyer/Seller | `GrossTech — Please verify your email address` |
| Login code | User | `GrossTech — Your sign-in code` |
| Password reset | User | `GrossTech — Your password reset code` |
| Order placed | Buyer | `Order #GT-XXXXXX Placed — GrossTech` |
| New order | Seller | `New Order #GT-XXXXXX — GrossTech` |
| New order | Admin | `[GrossTech] New Order #GT-XXXXXX` |
| Listing approved | Seller | `Your listing "X" is now live — GrossTech` |
| Listing needs changes | Seller | `Action needed: Your listing "X" — GrossTech` |
| Listing taken down | Seller | `Update regarding your listing "X" — GrossTech` |
| Payment failed | Buyer | `Payment failed — GrossTech` |

Buyer confirmation email includes seller contact for sellers in that order (so buyer can coordinate pickup/delivery). Self-pickup orders do NOT show delivery address section.

### Security
- Route protection via `src/middleware.ts`: `/admin/*` requires ADMIN, `/seller/*` requires SELLER or ADMIN, `/checkout/*` and `/orders/*` require auth
- All API routes re-check `getServerSession` independently (not relying solely on middleware)
- OTP brute force: 5 wrong attempts locks the token (`failedAttempts` field on OtpToken)
- Stock checked server-side before order (buyers cannot order 0-stock items)
- minQty enforced server-side
- Sellers cannot set their own listing to `isActive: true` (only admin approval flow can)
- Sellers editing approved listings triggers re-review
- Contact unlock checks for double-payment before creating Razorpay order
- Image upload validates MIME type and 5MB size limit
- PAN/bank details only collected for sellers — buyers need no financial KYC
- Security headers on all routes: X-Frame-Options DENY, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy

---

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (cached)
│   ├── layout.tsx                  # Root layout (font, Providers, NavigationProgress)
│   ├── globals.css                 # Tailwind + brand color tokens (@theme) + animations
│   │
│   ├── login/                      # Password + OTP login (tab switcher UI)
│   ├── signup/                     # Registration (pincode auto-fill, PAN/bank for sellers)
│   ├── verify/                     # Email + phone OTP verification after signup
│   ├── forgot-password/            # Password reset via OTP
│   ├── profile/                    # Edit profile + change password + photo upload
│   │
│   ├── products/
│   │   ├── page.tsx                # Product listing (cached, search/filter/mode)
│   │   └── items/[slug]/           # Item detail — all sellers for one item (cached + SSG)
│   │
│   ├── checkout/                   # Cart + Razorpay payment + delivery options
│   │   └── success/                # Order success page
│   ├── orders/                     # Buyer order history + status
│   ├── buyer-requests/             # Post and view buy requests
│   │
│   ├── seller/
│   │   ├── dashboard/              # Listing stats + recent listings
│   │   ├── listings/               # CRUD for seller's own listings
│   │   │   ├── new/                # Create listing form
│   │   │   └── [id]/edit/          # Edit listing form (works for rejected listings)
│   │   └── orders/                 # Incoming orders + expected payout date
│   │
│   ├── admin/
│   │   ├── dashboard/              # Revenue, orders, buyers, sellers, active listings
│   │   ├── approvals/              # Review pending seller listings (approve/reject)
│   │   ├── orders/                 # All orders + payout management + delivery charges
│   │   ├── analytics/              # Revenue breakdown, buyer stats, repeat customers
│   │   ├── items/                  # Manage categories + items (CatalogTabs)
│   │   ├── inventory/              # All listings (admin: edit, seller: remove with reason)
│   │   ├── buyer-requests/         # All buy requests with buyer contact details
│   │   └── contact-revenue/        # Revenue from contact unlocks
│   │
│   └── api/
│       ├── auth/                   # register, send-otp, verify-otp, reset-password
│       ├── user/                   # profile (GET/PUT), change-password, address
│       ├── upload/                 # Image upload → Vercel Blob
│       ├── categories/             # Public category list
│       ├── items/                  # Public item catalog
│       ├── listings/               # Seller listing CRUD + [id]/resolve
│       ├── products/               # Public product list + [id] detail
│       ├── orders/                 # Buyer order history
│       ├── buyer-requests/         # Create/list requests + [id]/resolve
│       ├── seller/contact/         # Reveal seller contact (paid or via purchase)
│       ├── payments/
│       │   ├── create-order/       # Create Razorpay order + DB orders (split by seller)
│       │   ├── verify/             # Verify payment HMAC, update status, send emails
│       │   ├── webhook/            # Razorpay webhook backup handler
│       │   ├── update-status/      # Mark order FAILED/CANCELLED
│       │   └── contact-unlock/     # Razorpay flow for seller contact reveal
│       └── admin/
│           ├── approvals/[id]/     # Approve or reject seller listing
│           ├── listings/[id]/remove/ # Remove seller listing with reason + email
│           ├── payouts/            # List ready-to-release + release payment
│           ├── orders/[id]/        # Set delivery charge
│           ├── analytics/          # Aggregated stats
│           ├── categories/         # Admin category management
│           ├── items/              # Admin item management
│           ├── products/           # Admin listing management
│           └── cache-bust/         # Force clear Next.js cache
│
├── components/
│   ├── landing/                    # HeroSection, CategoriesSection, FeaturedProducts,
│   │                               # HowItWorks, AboutSection
│   ├── layout/                     # Header (search + auth + nav), Footer
│   ├── products/                   # ItemCard, ItemDetailClient, ProductFilters,
│   │                               # ProductGridWrapper, ProductForm
│   ├── checkout/                   # CheckoutClient (cart UI + Razorpay)
│   ├── seller/                     # SellerSidebar, SellerListingsTable
│   ├── admin/                      # AdminSidebar, ApprovalManager, PayoutManager,
│   │                               # CategoryManager, ItemManager, AdminInventoryClient
│   ├── buyer-requests/             # RequestList (post + view + resolve toggle)
│   ├── NavigationProgress.tsx      # Thin green bar during navigation
│   └── ui/
│       ├── button, input, label, badge, select, table, separator
│       ├── dropdown-menu.tsx       # Radix UI dropdown
│       ├── sonner.tsx              # Toast notifications
│       ├── Modal.tsx               # Centered modal dialog (escape to close, backdrop click)
│       ├── EmptyState.tsx          # Centered empty state (icon + title + description)
│       ├── ImageUpload.tsx         # Drag-drop upload → client compress → Vercel Blob
│       └── AutoRefresh.tsx         # Silent page refresh at configurable interval
│
├── context/
│   └── CartContext.tsx             # Cart state — useReducer + localStorage per userId
│
└── lib/
    ├── auth.ts                     # NextAuth config — JWT callbacks, OTP + password auth
    ├── prisma.ts                   # Prisma singleton with PrismaPg adapter for Neon
    ├── cache.ts                    # unstable_cache wrappers + CACHE_TAGS + invalidateTag()
    ├── otp.ts                      # Generate/verify OTP, brute force (5 attempts = lock)
    ├── email.ts                    # All transactional emails (spam-safe subjects/content)
    ├── sms.ts                      # sendOtpSms via 2Factor.in
    ├── brand.ts                    # Brand name/tagline/contact — change here to rebrand
    ├── razorpay.ts                 # Razorpay client singleton
    └── constants.ts                # PLATFORM_FEE, CONTACT_UNLOCK_FEE, PAYMENT_HOLD_DAYS
```

---

## Key Business Rules

| Rule | Detail |
|---|---|
| **Listing approval** | Seller creates → PENDING_APPROVAL → Admin approves/rejects → APPROVED/REJECTED |
| **Re-review on edit** | Seller editing APPROVED or REJECTED listing → goes back to PENDING_APPROVAL |
| **Stock validation** | Checked server-side before order — buyers cannot order 0-stock or below minQty |
| **Split orders** | One Razorpay payment → one DB Order per seller (shared `checkoutId`, same `razorpayOrderId`) |
| **Payment hold** | Orders sit in PAYMENT_HELD for 3 days before admin can release to seller |
| **Platform fee** | ₹20 per checkout (currently ₹1 for testing) — change `PLATFORM_FEE` in constants.ts |
| **Contact unlock** | ₹10 (currently ₹1) to reveal seller phone/email. Free if buyer already purchased from that seller |
| **Bulk default** | Products page and listing form default to BULK mode (B2B wholesale app) |
| **Webhook backup** | Razorpay webhook handles cases where client-side verify fails |
| **Cache invalidation** | Every mutation (approve, reject, add item, edit listing) calls `invalidateTag()` immediately |
| **Image ownership** | Item images → admin uploads via panel. Listing images → seller uploads. Category → icons only |
| **Email spam** | Subjects avoid "OTP", "rejected", "not approved" — use neutral transactional language |

---

## Caching Architecture

```
Public pages (home, products, item detail)
  → unstable_cache with revalidate (30-60s)
  → On-demand invalidation via invalidateTag() on every mutation
  → Item detail pages pre-rendered at build time (generateStaticParams)

Admin/Seller pages
  → No caching — always fresh from DB
  → AutoRefresh component polls router.refresh() every 20-60s silently
```

---

## Image Architecture

```
User selects image
→ Client compresses to 800px JPEG (in browser, no server load)
→ POST /api/upload (authenticated)
→ Vercel Blob (Cloudflare CDN)
→ Returns URL like: https://xxxx.public.blob.vercel-storage.com/uploads/...
→ URL stored in DB imageUrl field

Where images are stored:
- Item.imageUrl       → Admin uploads via Admin → Items panel
- Listing.imageUrl    → Seller uploads when creating/editing listing
- User.profileImageUrl → User uploads via Edit Profile page
- Category.imageUrl   → DB field exists but unused (icons used instead)

BLOB_READ_WRITE_TOKEN required — set in Vercel Dashboard → Storage → Blob
```

---

## Planned / Not Yet Built

- **Mobile app**: React Native + Expo — same backend API, new frontend
- **AWS migration**: Amplify (hosting) + RDS PostgreSQL (replaces Neon, no cold starts) + SES (replaces Gmail SMTP, better deliverability)
- **Real-time updates**: Currently polling — upgrade to WebSockets/Pusher when on AWS
- **Farmer seller type + individual buyers**: B2C expansion planned
- **Seller profile edit**: Currently only edit via profile page — no dedicated seller settings
- **S3 image storage**: Replace Vercel Blob when migrating to AWS
- **Domain**: New brand name in progress — register via Route 53 after rebranding

---

## Deployment

```bash
git push origin main   # Vercel auto-deploys from main branch
```

Schema changes:
```bash
export $(grep -v '^#' .env | xargs) && npx prisma db push
npx prisma generate
git push   # triggers redeploy with new Prisma client
```
