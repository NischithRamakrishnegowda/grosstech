# GrossTech — AI Agent Context

This file is read automatically by Claude Code at the start of every session.
It gives AI agents the full context needed to work on this project without asking repeated questions.

---

## What This Project Is

**GrossTech** is a B2B wholesale marketplace where businesses buy daily essentials (rice, sugar, oil, dal, spices) in bulk from verified sellers. Think Indiamart but with direct escrow payments and an admin approval layer.

**Owner:** Nischith Ramakrishnegowda (nischithramakrishnegowda@gmail.com)
**Status:** Production app, live on Vercel, real users, real payments via Razorpay
**Stack:** Next.js 16 App Router + TypeScript + Tailwind + Prisma + PostgreSQL (Neon) + NextAuth

---

## Three User Roles

| Role | What they do |
|---|---|
| **BUYER** | Browses products (bulk/retail), adds to cart, pays via Razorpay, can pay ₹10 to unlock seller contact |
| **SELLER** | Creates listings (requires admin approval), receives orders, gets paid after 3-day hold |
| **ADMIN** | Approves/rejects listings, releases payouts, manages product catalog, views analytics |

---

## Most Important Files to Know

| File | Why it matters |
|---|---|
| `prisma/schema.prisma` | Single source of truth for all DB models. Check here before any DB work |
| `src/lib/cache.ts` | All cached DB queries live here. Add `invalidateTag()` to any mutation route |
| `src/lib/constants.ts` | PLATFORM_FEE=20, CONTACT_UNLOCK_FEE=10, PAYMENT_HOLD_DAYS=3 |
| `src/lib/brand.ts` | Brand name, tagline, contact. Change here to rebrand the whole app |
| `src/middleware.ts` | Route protection — /admin, /seller, /checkout, /orders all guarded here |
| `src/lib/auth.ts` | NextAuth config — JWT stores id, role, phone |
| `src/app/globals.css` | Brand color tokens defined in `@theme` block — `primary-*` classes use these |

---

## Critical Business Rules (Don't Break These)

1. **Seller edits an APPROVED listing → it goes back to PENDING_APPROVAL** (re-review required)
2. **Sellers cannot set `isActive: true` themselves** — only admin can via the approval flow
3. **Stock is checked server-side** before order creation — never trust client quantity
4. **minQty is enforced server-side** — `quantity >= priceOption.minQty` required
5. **Webhook uses `updateMany`** not `findFirst` — multiple seller orders share one Razorpay order ID
6. **OTP brute force** — 5 wrong attempts locks the OTP token (failedAttempts field on OtpToken)
7. **Contact unlock is idempotent** — check `isPaid` before creating new Razorpay order
8. **Platform fee (₹20)** is charged to buyer but tracked on the order record in DB

---

## Caching Pattern

All public pages use `unstable_cache` from `src/lib/cache.ts`. When you add a mutation route:
```ts
import { CACHE_TAGS, invalidateTag } from "@/lib/cache";
// after successful DB write:
invalidateTag(CACHE_TAGS.items);      // for listing/item changes
invalidateTag(CACHE_TAGS.categories); // for category changes
```
The `invalidateTag` wrapper handles the Next.js 16 two-argument requirement.

---

## Image Upload Pattern

All images go through `/api/upload` → Vercel Blob → short CDN URL stored in DB.
Use the `<ImageUpload>` component from `src/components/ui/ImageUpload.tsx`.
Never store base64 in the DB — old records may have it but new uploads must use Blob.
Requires `BLOB_READ_WRITE_TOKEN` env var from Vercel Dashboard → Storage → Blob.

---

## Design System

- Brand colors: `primary-*` Tailwind classes (e.g. `bg-primary-600`, `text-primary-700`)
- To rebrand: change the 11 oklch values in the `@theme` block in `src/app/globals.css`
- Cards: `bg-white rounded-2xl border border-gray-100`
- Inputs: `h-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500`
- Current design: clean white backgrounds, green accent only on CTAs — modeled after Zepto/Blinkit style
- No emojis anywhere — use Lucide icons

---

## Auth Notes

- NextAuth JWT stores: `id`, `role`, `phone`
- Access in server components: `getServerSession(authOptions)`
- Access in client components: `useSession()`
- Session type is augmented in `src/types/index.ts` to add role and phone
- Unverified users (emailVerified=false OR phoneVerified=false) cannot log in

---

## Dev Commands

```bash
npm run dev                                           # start dev server
npx tsc --noEmit                                      # type check (run before committing)
export $(grep -v '^#' .env | xargs) && npx prisma db push  # push schema changes to Neon
npx prisma generate                                   # regenerate client after schema change
npx prisma studio                                     # GUI to inspect DB
```

---

## Environment Variables Required

```
DATABASE_URL          Neon PostgreSQL connection string
NEXTAUTH_SECRET       Random secret for JWT signing
NEXTAUTH_URL          http://localhost:3000 (local) or production URL (Vercel)
RAZORPAY_KEY_ID       Razorpay public key
RAZORPAY_KEY_SECRET   Razorpay secret key
RAZORPAY_WEBHOOK_SECRET  Webhook signature verification
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM  Gmail SMTP
TWOFACTOR_API_KEY     2Factor.in API key for SMS OTP
BLOB_READ_WRITE_TOKEN Vercel Blob storage token
ADMIN_EMAIL           Admin email shown in transactional emails
ADMIN_PHONE           Admin phone shown in emails
```

---

## What's Planned (Not Yet Built)

- Mobile app: React Native + Expo, same API backend
- AWS migration: Amplify + RDS PostgreSQL + SES (replaces Vercel/Neon/Gmail)
- B2C expansion: farmer sellers + individual buyers (same codebase, new role types)
- Comprehensive agricultural product catalog with crop varieties
- Seller profile edit page (currently fields only collected at signup)

---

## Common Tasks

**Add a new DB field:**
1. Edit `prisma/schema.prisma`
2. `export $(grep -v '^#' .env | xargs) && npx prisma db push`
3. `npx prisma generate`
4. Update relevant API routes and forms

**Add a new page:**
- Server page with DB access: fetch directly via prisma in the page component, wrap in `unstable_cache` if public
- Client page: fetch from API route, handle loading/error states

**Add a new API route:**
- Always check `getServerSession(authOptions)` first
- Validate input with `zod`
- Call `invalidateTag()` after any write that affects cached public pages
- Return proper HTTP status codes (401 unauthorized, 403 forbidden, 400 bad input, 404 not found)
