import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AudioProvider } from "./contexts/AudioContext.jsx";

createRoot(document.getElementById("root")).render(
  <AudioProvider>
    <App />
  </AudioProvider>
);
