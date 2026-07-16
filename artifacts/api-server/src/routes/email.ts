import { Router } from "express";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "../lib/email";
import { logger } from "../lib/logger";

const emailRouter = Router();

/**
 * POST /api/email/order-confirmation
 * Called by the frontend right after a new order is inserted in Supabase.
 */
emailRouter.post("/email/order-confirmation", async (req, res) => {
  try {
    const order = req.body;
    if (!order?.order_number || !order?.customer_email) {
      res.status(400).json({ error: "Missing required order fields" });
      return;
    }
    await sendOrderConfirmation(order);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to send order confirmation email");
    res.status(500).json({ error: "Failed to send email" });
  }
});

/**
 * POST /api/email/order-update
 * Called by the admin panel after updating an order's status/tracking.
 */
emailRouter.post("/email/order-update", async (req, res) => {
  try {
    const order = req.body;
    if (!order?.order_number || !order?.customer_email) {
      res.status(400).json({ error: "Missing required order fields" });
      return;
    }
    await sendOrderStatusUpdate(order);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to send order update email");
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default emailRouter;
