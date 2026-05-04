import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./styles/index.css";

interface BootTimingState {
  pathname: string;
  bootShellRenderStartedAtMs: number | null;
  bootShellPaintAtMs: number | null;
  appRenderStartedAtMs: number | null;
  appPaintAtMs: number | null;
}

declare global {
  interface Window {
    __CC_BOOT_TIMING__?: BootTimingState;
  }
}

// Known-benign wallet / extension errors that should not surface visually.
// These originate from Eve Vault extension connect timeouts and browser
// extension message channel teardowns — not actionable app failures.
const BENIGN_PATTERNS = [
  "Connection request timed out",
  "message channel closed",
  "Registration un-successful",
];
const BENIGN_CONSOLE_PATTERNS = [
  "[DappKit] SmartObjectProvider: No object ID provided",
];

function isBenignWalletError(reason: unknown): boolean {
  const msg = reason instanceof Error ? reason.message : String(reason);
  return BENIGN_PATTERNS.some((p) => msg.includes(p));
}

function isBenignConsoleMessage(args: unknown[]): boolean {
  const message = args
    .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
    .join(" ");

  return BENIGN_CONSOLE_PATTERNS.some((pattern) => message.includes(pattern));
}

const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  if (isBenignConsoleMessage(args)) {
    return;
  }

  originalConsoleError(...args);
};

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

function writeBootTiming(update: Partial<BootTimingState>) {
  const current = window.__CC_BOOT_TIMING__ ?? {
    pathname: window.location.pathname,
    bootShellRenderStartedAtMs: null,
    bootShellPaintAtMs: null,
    appRenderStartedAtMs: null,
    appPaintAtMs: null,
  };
  window.__CC_BOOT_TIMING__ = {
    ...current,
    ...update,
    pathname: window.location.pathname,
  };
}

function markBootShellPaint() {
  requestAnimationFrame(() => {
    performance.mark("cc:boot-shell-painted");
    writeBootTiming({ bootShellPaintAtMs: performance.now() });
  });
}

function markAppPaint() {
  requestAnimationFrame(() => {
    performance.mark("cc:app-painted");
    writeBootTiming({ appPaintAtMs: performance.now() });
  });
}

function renderApp(content: React.ReactNode) {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>{content}</ErrorBoundary>
    </React.StrictMode>,
  );
}

function renderBootShell() {
  performance.mark("cc:boot-shell-render-start");
  writeBootTiming({ bootShellRenderStartedAtMs: performance.now() });
  renderApp(<BootShell />);
  markBootShellPaint();
}

function renderLoadedApp(content: React.ReactNode) {
  performance.mark("cc:app-render-start");
  writeBootTiming({ appRenderStartedAtMs: performance.now() });
  renderApp(content);
  markAppPaint();
}

function BootShell() {
  const navLabels = isStaticPreviewRoute
    ? ["Preview", "Static Surface", "Route"]
    : ["Command Overview", "Network Nodes", "Settings"];

  return (
    <div className="dark min-h-screen bg-background text-foreground" data-cc-boot-shell="true">
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center border-b border-border/60 bg-background/95 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-sm font-semibold tracking-[0.18em] text-primary">
            CC
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">CivilizationControl</p>
            <p className="text-sm font-semibold text-foreground">
              {isStaticPreviewRoute ? "Loading preview surface" : "Initializing command shell"}
            </p>
          </div>
        </div>
      </div>

      <div className="fixed inset-y-16 left-0 hidden w-64 border-r border-border/50 bg-muted/10 md:block">
        <div className="space-y-3 p-6">
          {navLabels.map((label) => (
            <div key={label} className="rounded border border-border/40 bg-background/30 px-3 py-2 text-xs font-medium text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
      </div>

      <main className="px-6 pb-6 pt-[5.5rem] md:ml-64">
        <div className="mx-auto max-w-[1760px] space-y-6">
          <section className="rounded-xl border border-border/50 bg-card/80 p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Boot Status</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Bringing the operator shell online</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Static shell content now paints before wallet, route, and query modules finish loading.
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <section className="rounded-xl border border-border/50 bg-card/60 p-6">
              <div className="h-3 w-28 rounded-full bg-muted/40" />
              <div className="mt-4 space-y-3">
                <div className="h-12 rounded-lg bg-muted/25" />
                <div className="h-12 rounded-lg bg-muted/20" />
                <div className="h-12 rounded-lg bg-muted/15" />
              </div>
            </section>
            <aside className="rounded-xl border border-border/50 bg-card/60 p-6">
              <div className="h-3 w-24 rounded-full bg-muted/35" />
              <div className="mt-4 space-y-3">
                <div className="h-16 rounded-lg bg-muted/20" />
                <div className="h-16 rounded-lg bg-muted/15" />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

async function bootstrapApp() {
  if (isStaticPreviewRoute) {
    if (window.location.pathname === "/dev/node-drilldown-lab") {
      const { NodeDrilldownLabScreen } = await import("./screens/NodeDrilldownLabScreen.tsx");
      renderLoadedApp(<NodeDrilldownLabScreen />);
      return;
    }

    const { NodeIconCatalogueScreen } = await import("./screens/NodeIconCatalogueScreen.tsx");
    renderLoadedApp(<NodeIconCatalogueScreen />);
    return;
  }

  const [{ EveFrontierProvider }, { default: App }, { queryClient }] = await Promise.all([
    import("@evefrontier/dapp-kit"),
    import("./App.tsx"),
    import("./lib/queryClient.ts"),
  ]);
  const appTree = <App />;

  renderLoadedApp(<EveFrontierProvider queryClient={queryClient}>{appTree}</EveFrontierProvider>);
}

renderBootShell();
void bootstrapApp();
