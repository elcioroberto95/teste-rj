import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./ui.tsx";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
