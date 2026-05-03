import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./styles/index.css";

// Known-benign wallet / extension errors that should not surface visually.
// These originate from Eve Vault extension connect timeouts and browser
// extension message channel teardowns — not actionable app failures.
const BENIGN_PATTERNS = [
  "Connection request timed out",
  "message channel closed",
  "Registration un-successful",
];

function isBenignWalletError(reason: unknown): boolean {
  const msg = reason instanceof Error ? reason.message : String(reason);
  return BENIGN_PATTERNS.some((p) => msg.includes(p));
}

// Surface unhandled promise rejections visually (CEF may not have devtools)
window.addEventListener("unhandledrejection", (e) => {
  if (isBenignWalletError(e.reason)) {
    console.warn("[wallet] suppressed benign rejection:", e.reason);
    e.preventDefault();
    return;
  }
  console.error("[UNHANDLED REJECTION]", e.reason);
  showRuntimeError("Unhandled rejection: " + String(e.reason));
});
window.addEventListener("error", (e) => {
  console.error("[UNCAUGHT ERROR]", e.error ?? e.message);
  showRuntimeError("Uncaught error: " + (e.error?.message ?? e.message));
});

function showRuntimeError(msg: string) {
  let el = document.getElementById("__runtime-error");
  if (!el) {
    el = document.createElement("div");
    el.id = "__runtime-error";
    Object.assign(el.style, {
      position: "fixed", bottom: "0", left: "0", right: "0",
      background: "#1c1917", borderTop: "2px solid #ef4444",
      color: "#fca5a5", fontSize: "11px", fontFamily: "monospace",
      padding: "8px 12px", zIndex: "99999", maxHeight: "30vh", overflow: "auto",
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
}

const STATIC_PREVIEW_PATHS = new Set([
  "/dev/node-icon-catalogue",
  "/dev/node-drilldown-lab",
]);
const isStaticPreviewRoute = STATIC_PREVIEW_PATHS.has(window.location.pathname);
const root = ReactDOM.createRoot(document.getElementById("root")!);

function renderApp(content: React.ReactNode) {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>{content}</ErrorBoundary>
    </React.StrictMode>,
  );
}

async function bootstrapApp() {
  if (isStaticPreviewRoute) {
    if (window.location.pathname === "/dev/node-drilldown-lab") {
      const { NodeDrilldownLabScreen } = await import("./screens/NodeDrilldownLabScreen.tsx");
      renderApp(<NodeDrilldownLabScreen />);
      return;
    }

    const { NodeIconCatalogueScreen } = await import("./screens/NodeIconCatalogueScreen.tsx");
    renderApp(<NodeIconCatalogueScreen />);
    return;
  }

  const [{ EveFrontierProvider }, { default: App }, { queryClient }] = await Promise.all([
    import("@evefrontier/dapp-kit"),
    import("./App.tsx"),
    import("./lib/queryClient.ts"),
  ]);
  const appTree = <App />;

  renderApp(<EveFrontierProvider queryClient={queryClient}>{appTree}</EveFrontierProvider>);
}

void bootstrapApp();
