import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { inject } from '@vercel/analytics';
import "./styles.css";

inject();

const router = getRouter();

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<RouterProvider router={router} />);
}
