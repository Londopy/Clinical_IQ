import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// Point all API calls at the backend. In production this is the Render URL
// injected at build time via VITE_API_URL. In local dev leave it empty so
// requests go to the same origin (proxied by Vite or the local Express server).
const apiUrl = import.meta.env.VITE_API_URL ?? "";
setBaseUrl(apiUrl || null);

createRoot(document.getElementById("root")!).render(<App />);
