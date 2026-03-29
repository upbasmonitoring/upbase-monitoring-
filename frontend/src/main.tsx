import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { ProjectProvider } from "./context/ProjectContext";
import App from "./App.tsx";
import "./index.css";

// 🛡️ SELF-HEALING: Auto-reload on ChunkLoadError
window.addEventListener('error', (e) => {
  if (e.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('Chunk load failed. Refreshing for latest version...');
    window.location.reload();
  }
}, true);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </ThemeProvider>
);
