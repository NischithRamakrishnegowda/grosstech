# GrossTech — AI Agent Context

This file is read automatically by Claude Code at the start of every session.
Read this fully before making any changes. Do not ask questions already answered here.

---

## What This Project Is

**GrossTech** is a production B2B wholesale marketplace for daily essentials (rice, sugar, oil, dal, spices). Think Indiamart but with direct escrow payments, an admin approval layer, and a full seller/buyer/admin dashboard.

**Owner:** Nischith Ramakrishnegowda (nischithramakrishnegowda@gmail.com)
**Status:** Live on Vercel, real users, real Razorpay payments
**Stack:** Next.js 16 App Router + TypeScript + Tailwind CSS v4 + Prisma + PostgreSQL (Neon) + NextAuth

---

## Three User Roles

| Role | What they do |
|---|---|
| **BUYER** | Browses products (bulk/retail), adds to cart, pays via Razorpay, unlocks seller contact (free if already purchased, ₹10 otherwise), posts buy requests, views orders |
| **SELLER** | Registers with PAN+bank, creates listings (admin must approve), receives orders, sees expected payout, gets paid after 3-day hold |
| **ADMIN** | Approves/rejects listings, manages catalog (categories+items), sets delivery charges, releases payouts, removes seller listings, sees all analytics and buy requests with contact details |

---

## ⚠️ Testing Flags — Must Change Before Go-Live

```ts
// src/lib/constants.ts
PLATFORM_FEE = 1          // TODO: change back to 20
CONTACT_UNLOCK_FEE = 1    // TODO: change back to 10
PAYMENT_HOLD_DAYS = 3     // keep as is
```

---

## Critical Business Rules — Never Break These

1. **Listing approval**: Seller creates → `PENDING_APPROVAL` → Admin approves/rejects. Only admin can set `isActive: true`
2. **Re-review on edit**: Seller editing an `APPROVED` or `REJECTED` listing → auto-sets back to `PENDING_APPROVAL`
3. **Sellers cannot bypass approval**: `isActive` field in PUT /api/listings/[id] is admin-only — sellers' `isActive` updates are ignored
4. **Stock check server-side**: Validate `stock >= quantity` and `quantity >= minQty` before creating order
5. **Split orders**: One Razorpay payment creates one DB `Order` per seller — all share `razorpayOrderId` and `checkoutId`
6. **Webhook uses updateMany**: Multiple seller orders share one razorpayOrderId — webhook must update ALL of them
7. **OTP brute force**: 5 wrong attempts locks the OTP token (`failedAttempts` field) — forces resend
8. **Contact unlock idempotency**: Check `isPaid` before creating new Razorpay order — prevent double payment
9. **Contact free after purchase**: If buyer has `PAYMENT_HELD` or `RELEASED_TO_SELLER` order with seller → show contact free (reason: "purchased")
10. **Cache invalidation**: Every mutation route must call `invalidateTag(CACHE_TAGS.items)` or `CACHE_TAGS.categories` — never skip this
11. **Email spam avoidance**: Never use words "OTP", "rejected", "not approved" in email subjects or red text. Use neutral language ("Action needed", "verification code", "requires changes")
12. **Platform fee**: ₹20 (currently ₹1 for testing) — stored on each order record
13. **Bulk default**: New listings default to BULK mode (not RETAIL). Products page defaults to BULK

---

## Most Important Files

| File | Why it matters |
|---|---|
| `prisma/schema.prisma` | Single source of truth for all DB models |
| `src/lib/constants.ts` | **PLATFORM_FEE=1, CONTACT_UNLOCK_FEE=1** — change before go-live |
| `src/lib/cache.ts` | All cached queries + `invalidateTag()` + `CACHE_TAGS` — always call after mutations |
| `src/lib/brand.ts` | Brand name, tagline, contact — change here to rebrand the whole app |
| `src/lib/email.ts` | All transactional emails — keep subjects spam-safe |
| `src/middleware.ts` | Route protection — /admin, /seller, /checkout, /orders |
| `src/lib/auth.ts` | NextAuth JWT — stores id, role, phone in token |
| `src/app/globals.css` | Brand colors in `@theme` block — change `primary-*` values to rebrand |

---

## Database Models (Quick Reference)

```
User           — id, name, email, phone, role, profileImageUrl, businessName,
                 street, city, state, pincode, upiId, accountNumber, ifscCode,
                 panNumber, gstNumber, declaration, emailVerified, phoneVerified

Category       — id, name, slug, imageUrl (unused — icons in code instead)

Item           — id, name, slug, imageUrl (admin uploads via panel → Vercel Blob)
                 categoryId

Listing        — id, name, brand, description, imageUrl (seller brand photo),
                 source (ADMIN|SELLER), isActive, status, rejectionReason,
                 categoryId, sellerId, itemId

PriceOption    — id, weight, price, stock, mode (RETAIL|BULK), minQty, listingId
                 (onDelete: Cascade)

Order          — id, checkoutId, razorpayOrderId, razorpayPaymentId,
                 razorpaySignature, buyerId, subtotal, platformFee, total,
                 status, paymentCapturedAt, releaseScheduledAt, releasedAt,
                 shippingAddress, shippingPhone, secondaryPhone,
                 deliveryOption (SELF_PICKUP|DELIVERY), deliveryCharge

OrderItem      — id, quantity, priceAtOrder, orderId, listingId, priceOptionId

OtpToken       — id, userId, code, verifiedToken, type, channel, expiresAt,
                 usedAt, failedAttempts (brute force: lock after 5)

ContactUnlock  — id, razorpayOrderId, razorpayPaymentId, fee, isPaid,
                 buyerId, sellerId, unlockedAt
                 Unique: (buyerId, sellerId)

BuyerRequest   — id, description, quantity, isResolved, resolvedAt, buyerId, itemId
```

---

## Caching Pattern

All public pages use `unstable_cache` from `src/lib/cache.ts`.

**After any mutation that affects public data, you MUST call:**
```ts
import { CACHE_TAGS, invalidateTag } from "@/lib/cache";
invalidateTag(CACHE_TAGS.items);      // listings, items changed
invalidateTag(CACHE_TAGS.categories); // categories changed
```

The `invalidateTag` wrapper handles Next.js 16's required second argument.

**Cache TTLs:**
- Home page: 60s
- Products page: 30s
- Item detail: 60s (also pre-rendered with generateStaticParams)

---

## Image Upload Pattern

```
User selects image → client compresses to 800px JPEG → POST /api/upload → Vercel Blob → URL in DB
```

Use `<ImageUpload>` from `src/components/ui/ImageUpload.tsx`.

**Three places images are stored:**
- `Item.imageUrl` — admin uploads via Admin → Items
- `Listing.imageUrl` — seller uploads when creating listing (shown on item detail per seller)
- `User.profileImageUrl` — user uploads via Edit Profile page
- `Category.imageUrl` — DB field exists but NOT used (Lucide icons used instead)

Requires `BLOB_READ_WRITE_TOKEN` env var.

---

## Auto-Refresh Pattern

Admin/seller pages silently poll using `router.refresh()` (no visible reload):
```tsx
import { AutoRefresh } from "@/components/ui/AutoRefresh";
<AutoRefresh intervalMs={20000} />  // 20s for operational pages
```

**Do NOT add to public pages** (landing, products) — those get too many visitors and polling wastes serverless budget. They rely on cache invalidation instead.

---

## Authentication Notes

- NextAuth JWT stores: `id`, `role`, `phone`
- Server: `getServerSession(authOptions)` — check this in every API route
- Client: `useSession()` — role check for conditional rendering
- Session type augmented in `src/types/index.ts`
- Unverified users (emailVerified=false OR phoneVerified=false) cannot log in
- Admin cannot self-register — must be set directly in DB
- OTP login flow: send-otp → verify-otp → get verifiedToken → signIn with otpToken

---

## Email Rules (Important)

All emails must follow spam-safe patterns:
- ❌ Never use: "OTP", "rejected", "not approved", red HTML text (#dc2626)
- ✅ Use instead: "verification code", "requires changes", "Action needed", neutral gray text
- Subjects must be professional: `GrossTech — [action]` format
- Test carefully — Gmail SMTP reputation affects ALL emails from that sender

---

## Contact Unlock Logic

```
/api/seller/contact/[sellerId]:
1. Check ContactUnlock.isPaid → if yes, return contact (reason: "unlocked")
2. Check if buyer has PAYMENT_HELD/RELEASED_TO_SELLER order with seller
   → if yes, return contact for free (reason: "purchased")
3. Otherwise → return { locked: true }
```

UI shows:
- "Previous Purchase" label when reason === "purchased"
- "Contact Unlocked" label when reason === "unlocked"
- Blurred contact + Unlock button when locked

---

## Design System

- **Primary colors**: `primary-*` Tailwind classes (e.g. `bg-primary-600`, `text-primary-700`)
- To rebrand: change the 11 oklch values in `@theme` block in `globals.css`
- **Cards**: `bg-white rounded-2xl border border-gray-100`
- **Inputs**: `h-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500`
- **Toggles**: Green pill style — `bg-gray-100 rounded-lg p-0.5` container, `bg-green-600 text-white` active
- **Empty states**: Use `<EmptyState>` component — never raw text
- **Modals**: Use `<Modal>` component for edit/create forms in admin
- No emojis anywhere — use Lucide icons

---

## Common Tasks

**Add a new DB field:**
```bash
# 1. Edit prisma/schema.prisma
export $(grep -v '^#' .env | xargs) && npx prisma db push
npx prisma generate
# 3. Update relevant API routes and forms
```

**Add a new API route:**
- Check `getServerSession(authOptions)` first
- Validate input with `zod`
- Call `invalidateTag()` after any write affecting public pages
- Return proper HTTP status codes

**Add a new public page:**
- Fetch data via `getCached*` from `src/lib/cache.ts`
- Add `generateStaticParams` if dynamic route
- Do NOT add `AutoRefresh` (public = too many visitors)

**Add a new admin/seller operational page:**
- Fetch directly from Prisma (no cache)
- Add `<AutoRefresh intervalMs={20000} />` at top of return

---

## What's Planned (Not Yet Built)

- Mobile app (React Native + Expo) — same API backend
- AWS migration: Amplify + RDS PostgreSQL + SES + S3 (replaces Vercel/Neon/Gmail/Blob)
- Real-time updates via WebSockets (currently polling)
- New brand name — domain to be registered via Route 53 after decision
- B2C expansion: farmer sellers + individual consumer buyers
