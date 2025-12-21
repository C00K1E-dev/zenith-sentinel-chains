import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from '@vercel/speed-insights';

createRoot(document.getElementById("root")!).render(<App />);

// Defer analytics to improve initial load performance
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    inject();
    injectSpeedInsights();
  });
}
