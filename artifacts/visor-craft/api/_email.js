import nodemailer from "nodemailer";

const GMAIL_USER = process.env["GMAIL_USER"];
const GMAIL_APP_PASSWORD = process.env["GMAIL_APP_PASSWORD"];
const OWNER_EMAIL = process.env["GMAIL_USER"];

export const emailReady = !!(GMAIL_USER && GMAIL_APP_PASSWORD);

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

function formatPrice(paise) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

const STATUS_LABEL = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABEL = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

function baseLayout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family:Arial,Helvetica,sans-serif; color:#1a1a1a; }
    .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
    .header { background:#e53935; padding:28px 32px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:22px; letter-spacing:.5px; }
    .header p  { margin:4px 0 0; color:#ffcdd2; font-size:13px; }
    .body { padding:28px 32px; }
    .section-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#e53935; margin:24px 0 8px; }
    table.items { width:100%; border-collapse:collapse; margin-top:4px; }
    table.items th { text-align:left; font-size:12px; color:#666; padding:6px 8px; border-bottom:1px solid #eee; }
    table.items td { font-size:14px; padding:8px 8px; border-bottom:1px solid #f0f0f0; }
    .totals { margin-top:8px; text-align:right; font-size:14px; }
    .totals .grand { font-size:16px; font-weight:700; color:#e53935; margin-top:4px; }
    .badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
    .badge-pending    { background:#fff3e0; color:#e65100; }
    .badge-processing { background:#e3f2fd; color:#1565c0; }
    .badge-shipped    { background:#e8f5e9; color:#2e7d32; }
    .badge-delivered  { background:#e8f5e9; color:#1b5e20; }
    .badge-cancelled  { background:#fce4ec; color:#c62828; }
    .badge-paid       { background:#e8f5e9; color:#2e7d32; }
    .info-row { display:flex; justify-content:space-between; font-size:14px; padding:5px 0; border-bottom:1px solid #f5f5f5; }
    .info-row span:first-child { color:#666; }
    .footer { background:#f9f9f9; padding:18px 32px; text-align:center; font-size:12px; color:#999; border-top:1px solid #eee; }
    a { color:#e53935; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🏍️ Vishnu Enterprises</h1>
      <p>Premium Helmet Visors · All India Delivery</p>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      Vishnu Enterprises · Johripur, North East Delhi · Delhi 110094<br/>
      <a href="mailto:vishnuenterprises.visor@gmail.com">vishnuenterprises.visor@gmail.com</a> · +91 79826 94772
    </div>
  </div>
</body>
</html>`;
}

function itemsTable(items) {
  if (!items || !items.length) return "";
  const rows = items
    .map(
      (i) => `<tr>
    <td>${i.product_name}</td>
    <td style="text-align:center">${i.quantity}</td>
    <td style="text-align:right">${formatPrice(i.unit_price_cents)}</td>
    <td style="text-align:right">${formatPrice(i.line_total_cents)}</td>
  </tr>`,
    )
    .join("");
  return `<table class="items">
  <thead><tr>
    <th>Product</th><th style="text-align:center">Qty</th>
    <th style="text-align:right">Unit</th><th style="text-align:right">Total</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`;
}

function buildCustomerConfirmationHtml(order) {
  const address = [
    order.shipping_address_line1, order.shipping_address_line2,
    order.shipping_landmark, order.shipping_city,
    order.shipping_state, order.shipping_pincode,
  ].filter(Boolean).join(", ");

  const body = `
    <p style="font-size:16px;margin-top:0">Hi <strong>${order.customer_name}</strong> 👋</p>
    <p style="color:#555;font-size:14px;margin-top:0">Thank you for your order! We've received it and will start processing it shortly.</p>
    <div class="section-title">Order Summary</div>
    <div class="info-row"><span>Order number</span><span><strong>${order.order_number}</strong></span></div>
    <div class="info-row"><span>Order status</span><span><span class="badge badge-${order.status}">${STATUS_LABEL[order.status] ?? order.status}</span></span></div>
    <div class="info-row"><span>Payment</span><span>${order.payment_method === "cod" ? "Cash on Delivery" : "UPI"} · <span class="badge badge-${order.payment_status}">${PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}</span></span></div>
    <div class="section-title">Items Ordered</div>
    ${itemsTable(order.items)}
    <div class="totals">
      <div>Subtotal: ${formatPrice(order.subtotal_cents)}</div>
      <div>Shipping: ${order.shipping_cents === 0 ? "FREE" : formatPrice(order.shipping_cents)}</div>
      <div class="grand">Total: ${formatPrice(order.total_cents)}</div>
    </div>
    <div class="section-title">Shipping To</div>
    <p style="font-size:14px;color:#444;margin:0">${address}</p>
    <p style="font-size:13px;color:#666;margin:6px 0 0">Phone: ${order.customer_phone}</p>
    <p style="margin-top:24px;font-size:13px;color:#777">Questions? WhatsApp us at <a href="https://wa.me/917982694772">+91 79826 94772</a> or reply to this email.</p>`;
  return baseLayout(`Order Confirmed — ${order.order_number}`, body);
}

function buildCustomerUpdateHtml(order) {
  const trackingSection = order.tracking_code
    ? `<div class="info-row"><span>Tracking code</span><span><strong>${order.tracking_code}</strong></span></div>`
    : "";
  const body = `
    <p style="font-size:16px;margin-top:0">Hi <strong>${order.customer_name}</strong> 👋</p>
    <p style="color:#555;font-size:14px;margin-top:0">Your order <strong>${order.order_number}</strong> has been updated.</p>
    <div class="section-title">Updated Status</div>
    <div class="info-row"><span>Order status</span><span><span class="badge badge-${order.status}">${STATUS_LABEL[order.status] ?? order.status}</span></span></div>
    <div class="info-row"><span>Payment status</span><span><span class="badge badge-${order.payment_status}">${PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}</span></span></div>
    ${trackingSection}
    <div class="section-title">Items</div>
    ${itemsTable(order.items)}
    <div class="totals"><div class="grand">Total: ${formatPrice(order.total_cents)}</div></div>
    <p style="margin-top:24px;font-size:13px;color:#777">Need help? WhatsApp us at <a href="https://wa.me/917982694772">+91 79826 94772</a>.</p>`;
  return baseLayout(`Order Update — ${order.order_number}`, body);
}

function buildOwnerNotificationHtml(order, type) {
  const address = [
    order.shipping_address_line1, order.shipping_address_line2,
    order.shipping_landmark, order.shipping_city,
    order.shipping_state, order.shipping_pincode,
  ].filter(Boolean).join(", ");

  const heading = type === "new" ? "🆕 New Order Received!" : "✏️ Order Updated";
  const body = `
    <p style="font-size:16px;margin-top:0"><strong>${heading}</strong></p>
    <div class="section-title">Order Details</div>
    <div class="info-row"><span>Order number</span><span><strong>${order.order_number}</strong></span></div>
    <div class="info-row"><span>Status</span><span><span class="badge badge-${order.status}">${STATUS_LABEL[order.status] ?? order.status}</span></span></div>
    <div class="info-row"><span>Payment</span><span>${order.payment_method === "cod" ? "Cash on Delivery" : "UPI"} · <span class="badge badge-${order.payment_status}">${PAYMENT_STATUS_LABEL[order.payment_status] ?? order.payment_status}</span></span></div>
    ${order.tracking_code ? `<div class="info-row"><span>Tracking</span><span>${order.tracking_code}</span></div>` : ""}
    <div class="section-title">Customer</div>
    <div class="info-row"><span>Name</span><span>${order.customer_name}</span></div>
    <div class="info-row"><span>Email</span><span><a href="mailto:${order.customer_email}">${order.customer_email}</a></span></div>
    <div class="info-row"><span>Phone</span><span><a href="tel:${order.customer_phone}">${order.customer_phone}</a></span></div>
    <div class="section-title">Ship To</div>
    <p style="font-size:14px;color:#444;margin:0">${address}</p>
    <div class="section-title">Items</div>
    ${itemsTable(order.items)}
    <div class="totals">
      <div>Subtotal: ${formatPrice(order.subtotal_cents)}</div>
      <div>Shipping: ${order.shipping_cents === 0 ? "FREE" : formatPrice(order.shipping_cents)}</div>
      <div class="grand">Total: ${formatPrice(order.total_cents)}</div>
    </div>`;
  return baseLayout(`${heading} — ${order.order_number}`, body);
}

export async function sendOrderConfirmation(order) {
  await Promise.all([
    transporter.sendMail({
      from: `"Vishnu Enterprises" <${GMAIL_USER}>`,
      to: order.customer_email,
      subject: `Order Confirmed ✅ — ${order.order_number} | Vishnu Enterprises`,
      html: buildCustomerConfirmationHtml(order),
    }),
    transporter.sendMail({
      from: `"Vishnu Enterprises Orders" <${GMAIL_USER}>`,
      to: OWNER_EMAIL,
      subject: `🆕 New Order — ${order.order_number} (${formatPrice(order.total_cents)})`,
      html: buildOwnerNotificationHtml(order, "new"),
    }),
  ]);
}

export async function sendOrderStatusUpdate(order) {
  await Promise.all([
    transporter.sendMail({
      from: `"Vishnu Enterprises" <${GMAIL_USER}>`,
      to: order.customer_email,
      subject: `Order Update 🔔 — ${order.order_number} | Vishnu Enterprises`,
      html: buildCustomerUpdateHtml(order),
    }),
    transporter.sendMail({
      from: `"Vishnu Enterprises Orders" <${GMAIL_USER}>`,
      to: OWNER_EMAIL,
      subject: `✏️ Order Updated — ${order.order_number}`,
      html: buildOwnerNotificationHtml(order, "update"),
    }),
  ]);
}
