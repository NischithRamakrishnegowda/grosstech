# Gross Tech Marketplace

A full-stack marketplace MVP for daily essential goods — rice, sugar, oil, pulses, and spices. Connects buyers and sellers with secure Razorpay payments, a transparent platform fee, and an admin dashboard for inventory management and analytics.

## Features

### Roles
| Role | Capabilities |
|------|-------------|
| **Buyer** | Browse products, add to cart, checkout via Razorpay, pay ₹10 to unlock seller contact |
| **Seller** | Add/edit product listings with weight-based pricing, manage orders |
| **Admin** | Manage inventory, view analytics (buyer activity, repeat customers), release payouts |

### Payments
- Razorpay integration for all transactions
- Flat ₹20 platform fee on every order
- 3-day payment hold — funds released to seller after delivery confirmation
- ₹10 to unlock seller contact details

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM (v7 with `@prisma/adapter-pg`)
- **Auth:** NextAuth.js v4 (Credentials + JWT, role-based)
- **Payments:** Razorpay
- **State:** React Context + useReducer (cart)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Docker)

### 1. Clone & install

```bash
git clone https://github.com/nischithramakrishnegowda/grosstech.git
cd grosstech
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/grosstech"
NEXTAUTH_SECRET="your-32-char-secret"
NEXTAUTH_URL="http://localhost:3000"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx tsx prisma/seed.ts
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@grosstech.com | admin123 |
| Seller | seller@grosstech.com | seller123 |
| Buyer | buyer@grosstech.com | buyer123 |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, Signup pages
│   ├── products/            # Product listing & detail
│   ├── checkout/            # Cart & payment flow
│   ├── orders/              # Buyer order history
│   ├── seller/              # Seller dashboard (listings, orders)
│   ├── admin/               # Admin dashboard (inventory, analytics, payouts)
│   └── api/                 # API routes
├── components/
│   ├── landing/             # Hero, categories, features sections
│   ├── layout/              # Header, Footer
│   ├── products/            # ProductCard, ProductForm, PriceSelector
│   ├── checkout/            # CheckoutClient, RazorpayButton
│   ├── seller/              # SellerListingsTable, SellerSidebar
│   ├── admin/               # AdminSidebar, PayoutManager
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── prisma.ts            # Prisma client singleton
│   ├── razorpay.ts          # Razorpay client
│   └── constants.ts         # PLATFORM_FEE, CONTACT_UNLOCK_FEE
├── context/
│   └── CartContext.tsx      # Cart state (persisted to localStorage)
└── types/
    └── index.ts             # NextAuth type augmentation
```

## API Routes

| Method | Route | Access |
|--------|-------|--------|
| GET | `/api/products` | Public |
| GET | `/api/products/[id]` | Public |
| POST | `/api/auth/register` | Public |
| POST/GET | `/api/listings` | Seller |
| PUT/DELETE | `/api/listings/[id]` | Seller (owner only) |
| POST | `/api/payments/create-order` | Buyer |
| POST | `/api/payments/verify` | Buyer |
| POST | `/api/payments/contact-unlock` | Buyer |
| GET | `/api/seller/contact/[sellerId]` | Buyer (if unlocked) |
| GET | `/api/admin/analytics` | Admin |
| GET/PUT | `/api/admin/payouts/[orderId]` | Admin |

## Deployment

**Recommended:** Vercel (frontend + API) + Railway or Supabase (PostgreSQL)

```bash
npx prisma migrate deploy
```

Set all environment variables in your hosting dashboard before deploying.
