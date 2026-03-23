/**
 * ErrorBoundary — Catches uncaught render errors and shows a visible
 * diagnostic panel instead of a white/grey screen.
 */

import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#09090b",
          color: "#f4f4f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily: "monospace",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            border: "1px solid #7f1d1d",
            borderRadius: "0.5rem",
            padding: "1.5rem",
            background: "#1c1917",
          }}>
            <h1 style={{ fontSize: "0.875rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.75rem" }}>
              Runtime Error
            </h1>
            <p style={{ fontSize: "0.75rem", color: "#a1a1aa", marginBottom: "0.5rem" }}>
              {this.state.error.message}
            </p>
            <pre style={{
              fontSize: "0.625rem",
              color: "#71717a",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              maxHeight: "12rem",
              overflow: "auto",
            }}>
              {this.state.error.stack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
