import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { ProjectProvider } from "./context/ProjectContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </ThemeProvider>
);
