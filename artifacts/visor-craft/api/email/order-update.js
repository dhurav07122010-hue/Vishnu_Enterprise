import { emailReady, sendOrderStatusUpdate } from "../_email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const order = req.body;
  if (!order?.order_number || !order?.customer_email) {
    return res.status(400).json({ error: "Missing required order fields" });
  }

  if (!emailReady) {
    console.warn("GMAIL_USER or GMAIL_APP_PASSWORD not set — email skipped");
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    await sendOrderStatusUpdate(order);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to send order update email:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
