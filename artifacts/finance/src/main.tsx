import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/themes";
import App from "./App";
import "./index.css";
import { ThemeProvider, useTheme } from "./lib/theme";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const PK: string = PUBLISHABLE_KEY;

function Root() {
  const { theme } = useTheme();
  return (
    <ClerkProvider
      publishableKey={PK}
      appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
      afterSignOutUrl={import.meta.env.BASE_URL}
    >
      <App />
    </ClerkProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <Root />
  </ThemeProvider>,
);
