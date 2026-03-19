import nodemailer from "nodemailer";
import { OtpType } from "@prisma/client";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? parseInt(SMTP_PORT) : 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "GrossTech <noreply@grosstech.in>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "";

function otpSubject(type: OtpType): string {
  if (type === OtpType.EMAIL_VERIFY) return "Verify your GrossTech email";
  if (type === OtpType.PASSWORD_RESET) return "Reset your GrossTech password";
  if (type === OtpType.LOGIN_OTP) return "Your GrossTech login OTP";
  return "Your GrossTech OTP";
}

function otpPurpose(type: OtpType): string {
  if (type === OtpType.EMAIL_VERIFY) return "verify your email address";
  if (type === OtpType.PASSWORD_RESET) return "reset your password";
  if (type === OtpType.LOGIN_OTP) return "log in to your account";
  return "complete your action";
}

export async function sendOtpEmail(to: string, name: string, code: string, type: OtpType) {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: otpSubject(type),
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
          <h2 style="color:#16a34a;margin:0 0 8px">GrossTech</h2>
          <p style="color:#374151;margin:0 0 24px">Hi ${name}, use the OTP below to ${otpPurpose(type)}.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px">
            <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#15803d">${code}</span>
          </div>
          <p style="color:#6b7280;font-size:13px;margin:0">Valid for 10 minutes. Do not share this OTP with anyone.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("sendOtpEmail error:", e);
  }
}

interface OrderItem {
  listing: { name: string; source: string; seller: { name: string; email: string; phone: string | null } };
  priceOption: { weight: string };
  quantity: number;
  priceAtOrder: number;
}

interface Order {
  id: string;
  subtotal: number;
  platformFee: number;
  total: number;
  shippingAddress?: string | null;
  shippingPhone?: string | null;
  secondaryPhone?: string | null;
  createdAt: Date;
}

interface Buyer {
  name: string;
  email: string;
  phone: string | null;
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function itemsTable(items: OrderItem[]): string {
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${i.listing.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${i.priceOption.weight}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(i.priceAtOrder * i.quantity)}</td>
      </tr>`
    )
    .join("");
  return `
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Product</th>
          <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Weight</th>
          <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function contactSection(items: OrderItem[]): string {
  // Collect unique SELLER-sourced sellers
  const sellerMap = new Map<string, { name: string; email: string; phone: string | null }>();
  for (const item of items) {
    if (item.listing.source === "SELLER") {
      const key = item.listing.seller.email;
      if (!sellerMap.has(key)) {
        sellerMap.set(key, {
          name: item.listing.seller.name,
          email: item.listing.seller.email,
          phone: item.listing.seller.phone,
        });
      }
    }
  }

  const sellerRows = Array.from(sellerMap.values())
    .map(
      (s) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.phone || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.email}</td>
      </tr>`
    )
    .join("");

  return `
    <h3 style="color:#374151;margin:24px 0 8px">Contact Details</h3>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:#f0fdf4">
          <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Contact</th>
          <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Phone</th>
          <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Email</th>
        </tr>
      </thead>
      <tbody>
        ${sellerRows}
        <tr>
          <td style="padding:8px 12px">GrossTech Admin</td>
          <td style="padding:8px 12px">${ADMIN_PHONE || "—"}</td>
          <td style="padding:8px 12px">${ADMIN_EMAIL}</td>
        </tr>
      </tbody>
    </table>`;
}

export async function sendBuyerOrderConfirmation(buyer: Buyer, order: Order, items: OrderItem[]) {
  const transporter = getTransporter();
  if (!transporter) return;
  const shortId = order.id.slice(-8).toUpperCase();
  try {
    await transporter.sendMail({
      from: FROM,
      to: buyer.email,
      subject: `Order #GT-${shortId} Placed — GrossTech`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff">
          <h2 style="color:#16a34a;margin:0 0 4px">GrossTech</h2>
          <p style="color:#6b7280;font-size:13px;margin:0 0 24px">Wholesale Marketplace</p>
          <h3 style="margin:0 0 4px;color:#111827">Order Placed!</h3>
          <p style="color:#374151;margin:0 0 24px">Hi ${buyer.name}, your order has been placed successfully. The seller/admin will contact you shortly for delivery.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280">Order ID</p>
            <p style="margin:0;font-weight:600;color:#111827">#GT-${shortId}</p>
          </div>
          ${itemsTable(items)}
          <div style="border-top:1px solid #e5e7eb;padding-top:16px;margin-top:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="color:#6b7280">Subtotal</span><span>${formatCurrency(order.subtotal)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:12px">
              <span style="color:#6b7280">Platform Fee</span><span>${formatCurrency(order.platformFee)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-weight:700;font-size:16px">
              <span>Total Paid</span><span style="color:#16a34a">${formatCurrency(order.total)}</span>
            </div>
          </div>
          ${order.shippingAddress ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:8px"><p style="margin:0 0 4px;font-size:13px;color:#6b7280">Delivery Address</p><p style="margin:0;color:#374151">${order.shippingAddress}</p></div>` : ""}
          ${contactSection(items)}
          <p style="color:#6b7280;font-size:12px;margin-top:24px">Reply to this email for any support queries.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("sendBuyerOrderConfirmation error:", e);
  }
}

export async function sendSellerOrderNotification(
  seller: { name: string; email: string },
  order: Order,
  sellerItems: OrderItem[],
  buyer: Buyer & { shippingAddress?: string | null; secondaryPhone?: string | null }
) {
  const transporter = getTransporter();
  if (!transporter) return;
  const shortId = order.id.slice(-8).toUpperCase();
  try {
    await transporter.sendMail({
      from: FROM,
      to: seller.email,
      subject: `New Order #GT-${shortId} — GrossTech`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff">
          <h2 style="color:#16a34a;margin:0 0 4px">GrossTech</h2>
          <p style="color:#6b7280;font-size:13px;margin:0 0 24px">Wholesale Marketplace</p>
          <h3 style="margin:0 0 4px;color:#111827">New Order Received!</h3>
          <p style="color:#374151;margin:0 0 24px">Hi ${seller.name}, you have a new order on GrossTech. Please fulfil it promptly.</p>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280">Order ID</p>
            <p style="margin:0;font-weight:600;color:#111827">#GT-${shortId}</p>
          </div>
          ${itemsTable(sellerItems)}
          <h3 style="color:#374151;margin:24px 0 8px">Buyer Details</h3>
          <div style="background:#f0fdf4;border-radius:8px;padding:16px">
            <p style="margin:0 0 6px"><strong>Name:</strong> ${buyer.name}</p>
            <p style="margin:0 0 6px"><strong>Email:</strong> ${buyer.email}</p>
            <p style="margin:0 0 6px"><strong>Phone:</strong> ${buyer.phone || "—"}</p>
            ${order.secondaryPhone ? `<p style="margin:0 0 6px"><strong>Alt Phone:</strong> ${order.secondaryPhone}</p>` : ""}
            ${order.shippingAddress ? `<p style="margin:0"><strong>Address:</strong> ${order.shippingAddress}</p>` : ""}
          </div>
          <p style="color:#6b7280;font-size:12px;margin-top:24px">Contact us at ${ADMIN_EMAIL} for any platform queries.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("sendSellerOrderNotification error:", e);
  }
}

export async function sendAdminOrderNotification(order: Order, buyer: Buyer, items: OrderItem[]) {
  const transporter = getTransporter();
  if (!transporter || !ADMIN_EMAIL) return;
  const shortId = order.id.slice(-8).toUpperCase();
  const hasAdminItems = items.some((i) => i.listing.source === "ADMIN");
  try {
    await transporter.sendMail({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[GrossTech] New Order #GT-${shortId}${hasAdminItems ? " — Needs Fulfillment" : ""}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff">
          <h2 style="color:#16a34a;margin:0 0 4px">GrossTech Admin</h2>
          <h3 style="margin:0 0 16px;color:#111827">New Order: #GT-${shortId}</h3>
          ${hasAdminItems ? `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;margin:0 0 16px"><strong style="color:#92400e">Action Required:</strong> This order contains GrossTech-listed items that need fulfillment.</div>` : ""}
          <h4 style="margin:0 0 8px">Buyer</h4>
          <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px">
            <p style="margin:0 0 4px">${buyer.name} · ${buyer.email} · ${buyer.phone || "—"}</p>
            ${order.shippingPhone ? `<p style="margin:0 0 4px">Shipping phone: ${order.shippingPhone}</p>` : ""}
            ${order.secondaryPhone ? `<p style="margin:0 0 4px">Alt phone: ${order.secondaryPhone}</p>` : ""}
            ${order.shippingAddress ? `<p style="margin:0">Address: ${order.shippingAddress}</p>` : ""}
          </div>
          <h4 style="margin:0 0 8px">Items</h4>
          <table style="width:100%;border-collapse:collapse;margin:0 0 16px">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Product</th>
                <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Supplier</th>
                <th style="padding:8px 12px;text-align:left;font-size:13px;color:#6b7280">Source</th>
                <th style="padding:8px 12px;text-align:center;font-size:13px;color:#6b7280">Qty</th>
                <th style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (i) => `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${i.listing.name} (${i.priceOption.weight})</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${i.listing.seller.name}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
                  <span style="background:${i.listing.source === "ADMIN" ? "#fef3c7" : "#dcfce7"};color:${i.listing.source === "ADMIN" ? "#92400e" : "#166534"};padding:2px 8px;border-radius:9999px;font-size:12px">${i.listing.source}</span>
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${i.quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(i.priceAtOrder * i.quantity)}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div style="border-top:2px solid #e5e7eb;padding-top:12px;font-weight:700;display:flex;justify-content:space-between">
            <span>Total</span><span style="color:#16a34a">${formatCurrency(order.total)}</span>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("sendAdminOrderNotification error:", e);
  }
}

export async function sendPaymentFailedEmail(buyer: Buyer, amount: number) {
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: FROM,
      to: buyer.email,
      subject: "Payment failed — GrossTech",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
          <h2 style="color:#16a34a;margin:0 0 8px">GrossTech</h2>
          <p style="color:#374151">Hi ${buyer.name}, your payment of <strong>${formatCurrency(amount)}</strong> could not be processed.</p>
          <p style="color:#374151">Your cart is saved — please try again or contact support at ${ADMIN_EMAIL}.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("sendPaymentFailedEmail error:", e);
  }
}
