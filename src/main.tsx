import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import "./utils/clearStorage"; // Import storage utilities for debugging
import { webVitalsReporter } from "./utils/web-vitals";

// Initialize Web Vitals monitoring
if (typeof window !== 'undefined') {
  webVitalsReporter.init();
  
  // Subscribe to metrics and send to analytics
  webVitalsReporter.subscribe((metric) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value, `(${metric.rating})`);
    }
    
    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      webVitalsReporter.sendToAnalytics(metric);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
