# GrossTech Marketplace — Architecture Reference

> **Purpose:** Complete reference for understanding, debugging, testing, and extending the codebase.
> **Last updated:** 2026-03-27

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [Database Schema](#4-database-schema)
5. [Authentication & Session](#5-authentication--session)
6. [Middleware & Route Protection](#6-middleware--route-protection)
7. [Pages & Routes](#7-pages--routes)
8. [API Routes](#8-api-routes)
9. [Components](#9-components)
10. [Utility Libraries](#10-utility-libraries)
11. [State Management](#11-state-management-cart)
12. [Key Business Workflows](#12-key-business-workflows)
13. [Business Rules & Constants](#13-business-rules--constants)
14. [Email & SMS Notifications](#14-email--sms-notifications)
15. [Security](#15-security)
16. [Deployment](#16-deployment)
17. [Common Bug Patterns](#17-common-bug-patterns)

---

## 1. Project Overview

GrossTech is a B2B wholesale marketplace for daily essentials (rice, sugar, oil, spices, etc.).

**Three user roles:**
- **BUYER** — browses products, places orders, unlocks seller contacts
- **SELLER** — lists products (requires admin approval), receives payouts
- **ADMIN** — approves listings, manages catalog, releases payouts, sets delivery charges

**Core mechanics:**
- Razorpay payment gateway (live keys)
- 3-day payment hold before seller payout
- ₹20 platform fee per order
- ₹10 contact unlock fee per buyer-seller pair
- OTP verification via email (Nodemailer) and SMS (Fast2SMS)
- Delivery option: Self Pickup or Delivery (charge set manually by admin)

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 16.1.7 |
| Language | TypeScript | 5 |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS | 4 |
| UI Components | shadcn/ui | — |
| Icons | Lucide React | 0.577.0 |
| ORM | Prisma | 7.5.0 |
| DB Driver | @prisma/adapter-pg + pg | 8.20.0 |
| Database | PostgreSQL (Neon) | — |
| Auth | NextAuth | 4.24.13 |
| Password Hashing | bcryptjs | 3.0.3 |
| Payments | Razorpay SDK | 2.9.6 |
| Email | Nodemailer | 7.0.13 |
| SMS | Fast2SMS HTTP API | — |
| Forms | React Hook Form + Zod | 7.71.2 / 3.25.76 |
| Toast Notifications | Sonner | 2.0.7 |
| Data Fetching | SWR | 2.4.1 |

**Build scripts:**
```
npm run dev      → next dev
npm run build    → prisma generate && next build
npm run start    → next start
npm run seed     → dotenv -e .env -- tsx prisma/seed.ts
```

---

## 3. Environment Variables

File: `.env` (gitignored — must be set in Vercel for production)

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:...@ep-late-thunder.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://grosstech.vercel.app   ← must be production URL on Vercel

# Razorpay (live keys)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=loftettrading2021@gmail.com
SMTP_PASSWORD=...   ← Gmail App Password (not account password)
SMTP_FROM=GrossTech <loftettrading2021@gmail.com>

# Admin contact (shown in emails and footer)
ADMIN_EMAIL=loftettrading2021@gmail.com
ADMIN_PHONE=+91 80883 45641

# SMS (Fast2SMS)
FAST2SMS_API_KEY=...
```

---

## 4. Database Schema

File: `prisma/schema.prisma`
DB: Neon PostgreSQL (remote). Schema changes: `npx prisma db push`

### User
```
id, name, email (unique), password (bcrypt), phone, role (BUYER|SELLER|ADMIN)
businessName         ← seller only
street, city, state, pincode
upiId, accountNumber, ifscCode   ← seller payment details for manual payout
emailVerified, phoneVerified
createdAt, updatedAt
```
Relations: `listings`, `ordersAsBuyer`, `contactUnlocksAsBuyer/AsSeller`, `otpTokens`, `buyerRequests`

### Category
```
id, name (unique), slug (unique), imageUrl
```
Relations: `listings`, `items`

### Item  _(predefined catalog items — admin managed)_
```
id, name, slug (unique), imageUrl, categoryId
```
Relations: `listings`, `buyerRequests`

### Listing  _(a seller's or admin's product)_
```
id, name, brand, description, imageUrl
source (ADMIN|SELLER)
status (PENDING_APPROVAL|APPROVED|REJECTED)
isActive (bool)
rejectionReason
categoryId, sellerId, itemId (optional — links to catalog Item)
```
Relations: `priceOptions`, `orderItems`

### PriceOption  _(weight variant of a listing)_
```
id, weight (string e.g. "25kg"), price, stock, mode (RETAIL|BULK), minQty
listingId
```
Relations: `orderItems`

### Order
```
id, buyerId
razorpayOrderId (unique), razorpayPaymentId (unique), razorpaySignature
subtotal, platformFee (default 20), total
status (PENDING|PAYMENT_HELD|RELEASED_TO_SELLER|FAILED|CANCELLED)
shippingAddress, shippingPhone, secondaryPhone
deliveryOption (string: "SELF_PICKUP"|"DELIVERY", default "SELF_PICKUP")
deliveryCharge (Float, nullable — set by admin)
paymentCapturedAt, releaseScheduledAt, releasedAt
createdAt, updatedAt
```
Relations: `items (OrderItem[])`

### OrderItem
```
id, orderId, listingId, priceOptionId, quantity, priceAtOrder
```

### OtpToken
```
id, userId, code (6-digit), verifiedToken (nullable, 5-min use-once)
type (EMAIL_VERIFY|PHONE_VERIFY|PASSWORD_RESET|LOGIN_OTP)
channel (EMAIL|PHONE)
expiresAt (10 min), usedAt, createdAt
```

### ContactUnlock
```
id, buyerId, sellerId
razorpayOrderId (unique), razorpayPaymentId
fee (default 10), isPaid, unlockedAt
```
Unique constraint: `(buyerId, sellerId)` — one unlock per pair

### BuyerRequest
```
id, buyerId, itemId (nullable), description, quantity, createdAt, updatedAt
```

---

## 5. Authentication & Session

File: `src/lib/auth.ts`

**Strategy:** NextAuth v4, JWT (no DB sessions)

**Two login methods:**

1. **Password login** — email + password → bcrypt compare
2. **OTP login** — email/phone → `verifiedToken` checked in credentials provider

**Session shape:**
```typescript
session.user = {
  id: string,
  email: string,
  name: string,
  role: "BUYER" | "SELLER" | "ADMIN",
  phone: string | null
}
```

**OTP flow:**
1. `POST /api/auth/send-otp` → generates 6-digit code, saves OtpToken (10-min expiry), sends email/SMS
2. `POST /api/auth/verify-otp` → validates code, creates signed `verifiedToken` (5-min expiry), marks OTP used
3. `POST /api/auth/[...nextauth]` with `{ otpToken }` → validates verifiedToken, signs JWT

Rate limit on `/api/auth/send-otp`: max 3 OTPs per user per 10 minutes

---

## 6. Middleware & Route Protection

File: `src/middleware.ts`

| Path pattern | Required role | Redirect if denied |
|-------------|--------------|-------------------|
| `/admin/*` | ADMIN | `/login?error=unauthorized` |
| `/seller/*` | SELLER or ADMIN | `/login?error=unauthorized` |
| `/checkout/*` | Any authenticated | `/login?callbackUrl=/checkout` |
| `/orders/*` | Any authenticated | `/login` |

---

## 7. Pages & Routes

### Public (no auth)

| URL | File | Description |
|-----|------|-------------|
| `/` | `src/app/page.tsx` | Landing — hero, categories, featured items, how-it-works |
| `/login` | `src/app/login/page.tsx` | Login (password + OTP tabs) |
| `/signup` | `src/app/signup/page.tsx` | Register (buyer or seller) |
| `/verify` | `src/app/verify/page.tsx` | Email + phone OTP verification |
| `/forgot-password` | `src/app/forgot-password/page.tsx` | Password reset via OTP |
| `/products` | `src/app/products/page.tsx` | Browse products (filters: category, search, mode, price) |
| `/products/[id]` | `src/app/products/[id]/page.tsx` | Listing detail + add to cart |
| `/products/items/[slug]` | `src/app/products/items/[slug]/page.tsx` | Item detail (all sellers side by side) |
| `/buyer-requests` | `src/app/buyer-requests/page.tsx` | Public buyer request board |

### Buyer (authenticated)

| URL | File | Description |
|-----|------|-------------|
| `/checkout` | `src/app/checkout/page.tsx` | Cart + delivery option + Razorpay payment |
| `/checkout/success` | `src/app/checkout/success/page.tsx` | Order confirmation |
| `/orders` | `src/app/orders/page.tsx` | Order history with delivery info |

### Seller (SELLER role)

| URL | File | Description |
|-----|------|-------------|
| `/seller/dashboard` | `src/app/seller/dashboard/page.tsx` | Stats (active listings, orders) |
| `/seller/listings` | `src/app/seller/listings/page.tsx` | Listing management table |
| `/seller/listings/new` | `src/app/seller/listings/new/page.tsx` | Create listing |
| `/seller/listings/[id]/edit` | `src/app/seller/listings/[id]/edit/page.tsx` | Edit listing |
| `/seller/orders` | `src/app/seller/orders/page.tsx` | Orders containing seller's items |

### Admin (ADMIN role)

| URL | File | Description |
|-----|------|-------------|
| `/admin/dashboard` | `src/app/admin/dashboard/page.tsx` | Revenue, orders, buyer/seller counts |
| `/admin/approvals` | `src/app/admin/approvals/page.tsx` | Approve/reject seller listings |
| `/admin/inventory` | `src/app/admin/inventory/page.tsx` | Admin-created listings |
| `/admin/inventory/new` | `src/app/admin/inventory/new/page.tsx` | Create admin listing |
| `/admin/inventory/[id]/edit` | `src/app/admin/inventory/[id]/edit/page.tsx` | Edit admin listing |
| `/admin/items` | `src/app/admin/items/page.tsx` | Manage catalog items & categories |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | Orders + payout management + delivery charges |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Revenue analytics |
| `/admin/buyer-requests` | `src/app/admin/buyer-requests/page.tsx` | All buyer requests |
| `/admin/contact-revenue` | `src/app/admin/contact-revenue/page.tsx` | Contact unlock revenue |

---

## 8. API Routes

### Auth

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth core |
| `/api/auth/register` | POST | — | Create user account |
| `/api/auth/send-otp` | POST | — | Send OTP (rate limited 3/10min) |
| `/api/auth/verify-otp` | POST | — | Validate OTP → verifiedToken |
| `/api/auth/reset-password` | POST | — | Reset password with verifiedToken |

### Products / Listings

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/products` | GET | — | All approved listings (paginated) |
| `/api/products/[id]` | GET | — | Single listing |
| `/api/items` | GET | — | Catalog items (search, `?all=true`) |
| `/api/items/[slug]` | GET | — | Single item |
| `/api/categories` | GET | — | All categories |
| `/api/listings` | GET | SELLER | Seller's own listings |
| `/api/listings` | POST | SELLER | Create listing (→ PENDING_APPROVAL) |
| `/api/listings/[id]` | GET/PUT/DELETE | SELLER | Manage own listing |

### Orders & Payments

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/orders` | GET | any | Buyer's orders |
| `/api/payments/create-order` | POST | BUYER | Create Razorpay order + DB Order (PENDING) |
| `/api/payments/verify` | POST | BUYER | Verify Razorpay signature → PAYMENT_HELD + emails |
| `/api/payments/webhook` | POST | — | Razorpay webhook (backup verification) |
| `/api/payments/update-status` | POST | BUYER | Mark order FAILED or CANCELLED |
| `/api/payments/contact-unlock` | POST | BUYER | Create ₹10 Razorpay order for contact unlock |
| `/api/payments/contact-unlock/verify` | POST | BUYER | Verify unlock payment, save ContactUnlock |

### Admin

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/admin/approvals` | GET | ADMIN | Pending listings |
| `/api/admin/approvals/[id]` | PUT | ADMIN | Approve/reject listing |
| `/api/admin/payouts` | GET | ADMIN | Orders ready for payout |
| `/api/admin/payouts/[orderId]` | PUT | ADMIN | Release payout → RELEASED_TO_SELLER |
| `/api/admin/orders/[orderId]/delivery-charge` | PATCH | ADMIN | Set delivery charge amount |
| `/api/admin/categories` | GET/POST | ADMIN | Manage categories |
| `/api/admin/categories/[id]` | PUT/DELETE | ADMIN | Edit/delete category |
| `/api/admin/items` | GET/POST | ADMIN | Manage catalog items |
| `/api/admin/items/[id]` | PUT/DELETE | ADMIN | Edit/delete item |
| `/api/admin/products` | GET/POST | ADMIN | Admin-sourced listings |
| `/api/admin/products/[id]` | PUT/DELETE | ADMIN | Edit/delete admin listing |
| `/api/admin/analytics` | GET | ADMIN | Revenue + stats |

### Misc

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/user/address` | GET | any | Prefill checkout with saved address |
| `/api/seller/contact/[sellerId]` | GET | BUYER | Seller contact (requires ContactUnlock) |
| `/api/buyer-requests` | GET/POST | GET: — / POST: BUYER | Buyer requests board |

---

## 9. Components

### Layout
| File | Purpose |
|------|---------|
| `src/components/layout/Header.tsx` | Sticky nav — logo, links, auth dropdown, cart count, mobile menu |
| `src/components/layout/Footer.tsx` | Footer — reads email/phone from `ADMIN_EMAIL`/`ADMIN_PHONE` env vars |
| `src/app/providers.tsx` | Wraps app: SessionProvider + CartProvider + Toaster |

### Landing Page
| File | Purpose |
|------|---------|
| `src/components/landing/HeroSection.tsx` | Hero banner + CTA |
| `src/components/landing/CategoriesSection.tsx` | Category grid |
| `src/components/landing/FeaturedProducts.tsx` | Featured items (uses ItemCard) |
| `src/components/landing/HowItWorks.tsx` | Step-by-step explainer |
| `src/components/landing/AboutSection.tsx` | About GrossTech |

### Products
| File | Purpose |
|------|---------|
| `src/components/products/ItemCard.tsx` | Card showing item name, lowest price, seller count → links to `/products/items/[slug]` |
| `src/components/products/ProductCard.tsx` | Listing card (used on products page) |
| `src/components/products/ProductDetailClient.tsx` | Listing detail — price options, add-to-cart |
| `src/components/products/ItemDetailClient.tsx` | Item detail — all sellers side by side |
| `src/components/products/ProductFilters.tsx` | Category/search/mode/price filters |
| `src/components/products/ProductForm.tsx` | Create/edit listing form (shared by seller + admin) |

### Checkout
| File | Purpose |
|------|---------|
| `src/components/checkout/CheckoutClient.tsx` | Full checkout: cart items, delivery option (Self Pickup / Delivery), address form, order summary, Razorpay |

### Admin
| File | Purpose |
|------|---------|
| `src/components/admin/AdminSidebar.tsx` | Admin nav sidebar |
| `src/components/admin/ApprovalManager.tsx` | Approve/reject listings UI |
| `src/components/admin/CategoryManager.tsx` | Category CRUD |
| `src/components/admin/ItemManager.tsx` | Item CRUD |
| `src/components/admin/PayoutManager.tsx` | Order list, payout release, delivery charge input, seller payment info |

### Seller
| File | Purpose |
|------|---------|
| `src/components/seller/SellerSidebar.tsx` | Seller nav sidebar |
| `src/components/seller/SellerListingsTable.tsx` | Listings table with edit/delete actions |

### UI Library (shadcn/ui)
`src/components/ui/` — button, input, label, select, dropdown-menu, badge, separator, table, sonner

---

## 10. Utility Libraries

### `src/lib/prisma.ts`
Singleton Prisma client using `@prisma/adapter-pg`. Reads `DATABASE_URL` from env.

### `src/lib/auth.ts`
NextAuth `authOptions`. JWT callbacks add `id`, `role`, `phone` to token → session.

### `src/lib/otp.ts`
- `generateAndSaveOtp(userId, type, channel)` → saves to DB, returns 6-digit code
- `verifyOtpCode(userId, code, type, channel)` → validates, marks used, returns `verifiedToken`
- `validateVerifiedToken(token)` → checks DB, returns `userId` or null

### `src/lib/email.ts`
Nodemailer transporter. Functions:
- `sendOtpEmail(to, name, code, type)`
- `sendBuyerOrderConfirmation(buyer, order, items)` — includes delivery option
- `sendSellerOrderNotification(seller, order, sellerItems, buyer)` — includes delivery
- `sendAdminOrderNotification(order, buyer, items)` — includes delivery flag
- `sendListingApprovedEmail(seller, listingName)`
- `sendListingRejectedEmail(seller, listingName, reason)`
- `sendPaymentFailedEmail(buyer, amount)`

### `src/lib/sms.ts`
Fast2SMS HTTP API. Function:
- `sendOtpSms(phone, code)` → strips +91, sends via `route=q` with custom message

### `src/lib/razorpay.ts`
Razorpay SDK instance using `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`.

### `src/lib/constants.ts`
```typescript
PLATFORM_FEE = 20         // ₹ added to every order
CONTACT_UNLOCK_FEE = 10   // ₹ per seller contact unlock
PAYMENT_HOLD_DAYS = 3     // days before admin can release payout
```

### `src/lib/utils.ts`
`cn(...classes)` — Tailwind class merging via `clsx` + `tailwind-merge`

---

## 11. State Management (Cart)

File: `src/context/CartContext.tsx`

```typescript
interface CartItem {
  listingId, priceOptionId, name, brand, weight,
  price, stock, imageUrl, quantity, mode
}
```

**Actions:** ADD, REMOVE, UPDATE_QTY, CLEAR, INIT

**Persistence:** `localStorage` under key `cart_${userId}` (per-user, survives page reload)

**Hook:** `useCart()` → `{ items, cartReady, addItem, removeItem, updateQty, clearCart }`

---

## 12. Key Business Workflows

### A. Signup & Verification
```
/signup form
  → POST /api/auth/register
      → hash password, create User (emailVerified: false, phoneVerified: false)
      → generate EMAIL_VERIFY OTP → sendOtpEmail
      → generate PHONE_VERIFY OTP → sendOtpSms
  → redirect /verify
      → user enters email OTP → POST /api/auth/verify-otp (type: EMAIL_VERIFY)
      → user enters phone OTP → POST /api/auth/verify-otp (type: PHONE_VERIFY)
```

### B. Password Login
```
/login form
  → POST /api/auth/[...nextauth] credentials
      → find user by email
      → bcrypt.compare(password, hash)
      → sign JWT (id, role, phone)
```

### C. OTP Login
```
/login → enter email/phone
  → POST /api/auth/send-otp → save OtpToken (10 min), send email/SMS
→ enter 6-digit code
  → POST /api/auth/verify-otp → validate code, return verifiedToken (5 min)
  → POST /api/auth/[...nextauth] { otpToken }
      → find OtpToken by verifiedToken, validate expiry, mark used
      → sign JWT
```

### D. Product Listing & Approval
```
/seller/listings/new → POST /api/listings
  → Listing created: status=PENDING_APPROVAL, isActive=false

/admin/approvals → PUT /api/admin/approvals/[id]
  Approve: status=APPROVED, isActive=true → sendListingApprovedEmail
  Reject:  status=REJECTED, rejectionReason=... → sendListingRejectedEmail
```

### E. Order & Payment
```
/checkout → select delivery option → enter address
  → POST /api/payments/create-order
      → validate cart items from DB (never trust client prices)
      → calculate: total = subtotal + PLATFORM_FEE
      → create Razorpay order
      → save Order (status=PENDING, deliveryOption)
  → Razorpay modal opens → user pays
  → POST /api/payments/verify
      → HMAC-SHA256 signature check
      → Order: PENDING → PAYMENT_HELD
      → releaseScheduledAt = now + 3 days
      → decrement stock on all PriceOptions (transaction)
      → send 3 emails: buyer + seller(s) + admin

Backup: POST /api/payments/webhook
  → payment.captured event: same status update if client missed it
  → payment.failed: Order → FAILED
```

### F. Admin Payout
```
/admin/orders
  → GET /api/admin/payouts → orders where status=PAYMENT_HELD AND releaseScheduledAt ≤ now
  → For delivery orders: admin enters delivery charge → PATCH /api/admin/orders/[id]/delivery-charge
  → Admin clicks "Release" → PUT /api/admin/payouts/[orderId]
      → Order: PAYMENT_HELD → RELEASED_TO_SELLER, releasedAt = now
      → Admin manually transfers to seller (UPI/bank shown in UI)
```

### G. Contact Unlock
```
/products/[id] → "Unlock Contact" button
  → POST /api/payments/contact-unlock → Razorpay ₹10 order
  → Razorpay payment
  → POST /api/payments/contact-unlock/verify
      → verify signature
      → upsert ContactUnlock (isPaid=true, unlockedAt=now)
  → GET /api/seller/contact/[sellerId]
      → check ContactUnlock.isPaid = true
      → return seller name, phone, email, address
```

---

## 13. Business Rules & Constants

| Rule | Value | File |
|------|-------|------|
| Platform fee per order | ₹20 | `src/lib/constants.ts` |
| Contact unlock fee | ₹10 | `src/lib/constants.ts` |
| Payment hold period | 3 days | `src/lib/constants.ts` |
| OTP expiry | 10 minutes | `src/lib/otp.ts` |
| OTP verified token expiry | 5 minutes | `src/lib/otp.ts` |
| OTP rate limit | 3 per 10 minutes | `/api/auth/send-otp` |
| Payout recipient | Manual (no auto-transfer) | `/api/admin/payouts/[orderId]` |
| Stock deducted | On payment captured, not on order creation | `/api/payments/verify` |
| Admin listings auto-approved | `source=ADMIN` → `status=APPROVED` | `/api/admin/products` |
| Seller listings need approval | `source=SELLER` → `status=PENDING_APPROVAL` | `/api/listings` |
| Delivery charge collection | Out-of-band (not via Razorpay) | Admin panel only |

---

## 14. Email & SMS Notifications

### Email triggers

| Event | Recipients | Template |
|-------|-----------|----------|
| Signup / OTP request | User | OTP code |
| Order placed (payment captured) | Buyer, Seller(s), Admin | Order details + delivery option |
| Listing approved | Seller | Approval confirmation |
| Listing rejected | Seller | Rejection reason |
| Payment failed | Buyer | Retry prompt |

### SMS triggers
| Event | Recipient |
|-------|----------|
| Signup (PHONE_VERIFY OTP) | New user |
| OTP login | User |
| Password reset OTP | User |

**SMS Provider:** Fast2SMS (`route=q`)
**Email Provider:** Gmail SMTP via Nodemailer

---

## 15. Security

| Concern | Approach |
|---------|----------|
| Passwords | bcrypt, 10 salt rounds |
| OTP codes | `crypto.randomInt` (CSPRNG), time-limited, single-use |
| Payment verification | HMAC-SHA256 Razorpay signature check |
| API authorization | `getServerSession` check on every protected route |
| Route protection | Next.js middleware (role-based) |
| Input validation | Zod schemas on all POST/PUT/PATCH routes |
| SQL injection | Prisma parameterized queries |
| Price tampering | Server re-fetches prices from DB on order creation |
| Session | JWT via NextAuth, httpOnly cookies |

---

## 16. Deployment

**Platform:** Vercel (auto-deploy from GitHub `main` branch)
**Database:** Neon (serverless PostgreSQL)
**Schema updates:** `npx prisma db push` (no migration files — pushes schema directly)

**Post-deploy checklist:**
- [ ] `NEXTAUTH_URL` set to production Vercel URL
- [ ] `RAZORPAY_WEBHOOK_SECRET` configured in Razorpay Dashboard → Webhooks
- [ ] All env vars present in Vercel dashboard
- [ ] Razorpay webhook URL set to `https://grosstech.vercel.app/api/payments/webhook`

---

## 17. Common Bug Patterns

### Payment issues
- **Order stuck at PENDING** → webhook not configured, or `/api/payments/verify` not called. Check Razorpay Dashboard → Payments for status.
- **Stock not decremented** → verify `/api/payments/verify` ran successfully (not webhook fallback timing).

### Auth issues
- **OTP not arriving (email)** → check `SMTP_PASSWORD` is Gmail App Password, not Gmail account password.
- **OTP not arriving (SMS)** → check Fast2SMS credits, check Vercel logs for `Fast2SMS error:`.
- **Redirect loop on login** → `NEXTAUTH_URL` not matching production domain.

### Database issues
- **Schema out of sync** → run `npx prisma generate && npx prisma db push` after any schema change.
- **New fields missing on existing records** → run a DB update query for nullable/default fields.

### Listing / approval issues
- **Listing not showing in /products** → check `status=APPROVED` AND `isActive=true`.
- **Admin listing not auto-approved** → check `source` field is `"ADMIN"` in the create route.

### Delivery / order issues
- **deliveryCharge not saving** → PATCH `/api/admin/orders/[orderId]/delivery-charge` requires ADMIN session.
- **Address validation blocking self-pickup** → `deliveryOption` must equal `"SELF_PICKUP"` to skip address validation in CheckoutClient.
