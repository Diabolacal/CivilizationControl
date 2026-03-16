import { useConnection } from "@evefrontier/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import { useAuthorizeExtension } from "./hooks/useAuthorizeExtension";
import {
  CC_PACKAGE_ID,
  GATE_ID,
  GATE_OWNER_CAP_ID,
  SSU_ID,
  SSU_OWNER_CAP_ID,
  CHARACTER_ID,
} from "./constants";

const short = (id: string) => `${id.slice(0, 6)}…${id.slice(-4)}`;

function App() {
  const { handleConnect, handleDisconnect } = useConnection();
  const account = useCurrentAccount();
  const {
    authorizeGate,
    gateStatus,
    gateResult,
    gateError,
    authorizeSsu,
    ssuStatus,
    ssuResult,
    ssuError,
  } = useAuthorizeExtension();

  return (
    <div style={{ fontFamily: "monospace", maxWidth: 720, margin: "40px auto", padding: "0 20px" }}>
      <h1 style={{ fontSize: 20 }}>CivilizationControl — Owner Auth Harness</h1>
      <p style={{ color: "#888", fontSize: 13 }}>
        Minimal tool for the two blocked Hour 5 owner-authorization actions.
      </p>

      <hr style={{ borderColor: "#333", margin: "16px 0" }} />

      {/* Wallet connection */}
      <section>
        <h2 style={{ fontSize: 16 }}>Wallet</h2>
        {account ? (
          <div>
            <p>Connected: <strong>{account.address}</strong></p>
            <button onClick={handleDisconnect} style={btnStyle}>Disconnect</button>
          </div>
        ) : (
          <button onClick={handleConnect} style={btnStyle}>Connect EVE Vault</button>
        )}
      </section>

      <hr style={{ borderColor: "#333", margin: "16px 0" }} />

      {/* Target summary */}
      <section>
        <h2 style={{ fontSize: 16 }}>Targets</h2>
        <table style={{ fontSize: 12, borderCollapse: "collapse" }}>
          <tbody>
            <Row label="CC Package" value={CC_PACKAGE_ID} />
            <Row label="Character" value={CHARACTER_ID} />
            <Row label="Gate" value={GATE_ID} />
            <Row label="Gate OwnerCap" value={GATE_OWNER_CAP_ID} />
            <Row label="SSU" value={SSU_ID} />
            <Row label="SSU OwnerCap" value={SSU_OWNER_CAP_ID} />
          </tbody>
        </table>
      </section>

      <hr style={{ borderColor: "#333", margin: "16px 0" }} />

      {/* Action 1: Gate */}
      <section>
        <h2 style={{ fontSize: 16 }}>Action 1 — Authorize GateAuth on Gate</h2>
        <p style={{ fontSize: 12, color: "#aaa" }}>
          borrow_owner_cap → gate::authorize_extension&lt;GateAuth&gt; → return_owner_cap
        </p>
        <button
          onClick={authorizeGate}
          disabled={!account || gateStatus === "pending"}
          style={btnStyle}
        >
          {gateStatus === "pending" ? "Signing…" : "Authorize GateAuth"}
        </button>
        <StatusDisplay status={gateStatus} digest={gateResult?.digest} error={gateError} />
      </section>

      <hr style={{ borderColor: "#333", margin: "16px 0" }} />

      {/* Action 2: SSU */}
      <section>
        <h2 style={{ fontSize: 16 }}>Action 2 — Authorize TradeAuth on SSU</h2>
        <p style={{ fontSize: 12, color: "#aaa" }}>
          borrow_owner_cap → storage_unit::authorize_extension&lt;TradeAuth&gt; → return_owner_cap
        </p>
        <button
          onClick={authorizeSsu}
          disabled={!account || ssuStatus === "pending"}
          style={btnStyle}
        >
          {ssuStatus === "pending" ? "Signing…" : "Authorize TradeAuth"}
        </button>
        <StatusDisplay status={ssuStatus} digest={ssuResult?.digest} error={ssuError} />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: "2px 12px 2px 0", color: "#888" }}>{label}</td>
      <td title={value}>{short(value)}</td>
    </tr>
  );
}

interface StatusDisplayProps {
  status: string;
  digest?: string;
  error?: string | null;
}

function StatusDisplay({ status, digest, error }: StatusDisplayProps) {
  if (status === "success" && digest) {
    return (
      <p style={{ color: "#4ade80", fontSize: 13 }}>
        Success — TX: <code>{digest}</code>
      </p>
    );
  }
  if (status === "error" && error) {
    const isNonceMismatch = error.includes("nonce mismatch") || error.includes("device data was regenerated");
    return (
      <div style={{ fontSize: 13 }}>
        <p style={{ color: "#f87171" }}>Error: {error}</p>
        {isNonceMismatch && (
          <div style={{ background: "#332200", border: "1px solid #665500", padding: 10, marginTop: 8 }}>
            <p style={{ color: "#facc15", margin: "0 0 6px" }}>
              <strong>Recovery — EVE Vault session is stale:</strong>
            </p>
            <ol style={{ color: "#ddd", margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
              <li>Open the <strong>EVE Vault</strong> browser extension popup.</li>
              <li>Click your profile / settings and <strong>Sign Out</strong>.</li>
              <li>Close and re-open the Vault extension.</li>
              <li><strong>Sign back in</strong> to Vault (this regenerates device data + JWT together).</li>
              <li>Return to this page and click <strong>Connect EVE Vault</strong>.</li>
              <li>Retry the action.</li>
            </ol>
          </div>
        )}
      </div>
    );
  }
  if (status === "pending") {
    return <p style={{ color: "#facc15", fontSize: 13 }}>Waiting for wallet signature…</p>;
  }
  return null;
}

const btnStyle: React.CSSProperties = {
  background: "#333",
  color: "#eee",
  border: "1px solid #555",
  padding: "8px 16px",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "monospace",
};

export default App;
