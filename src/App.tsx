/**
 * App — Root layout shell.
 *
 * Layout: Fixed Header (h-16) + Fixed Sidebar (w-64) + Main content area.
 * Routes follow UX architecture spec §3 screen hierarchy.
 *
 * Data flow: useAssetDiscovery → structures → nodeGroups → child components.
 * Solar system catalog loads in background on mount.
 */

import { BrowserRouter, Routes, Route, useLocation, type Location } from "react-router";
import { useCallback, useState, type CSSProperties } from "react";
import { Header } from "@/components/Header";
import { ShellRouteTransition } from "@/components/ShellRouteTransition";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/screens/Dashboard";
import { GateListScreen } from "@/screens/GateListScreen";
import { GateDetailScreen } from "@/screens/GateDetailScreen";
import { GatePermitPage } from "@/screens/GatePermitPage";
import { SsuMarketplacePage } from "@/screens/SsuMarketplacePage";
import { TradePostListScreen } from "@/screens/TradePostListScreen";
import { TradePostDetailScreen } from "@/screens/TradePostDetailScreen";
import { TurretListScreen } from "@/screens/TurretListScreen";
import { TurretDetailScreen } from "@/screens/TurretDetailScreen";
import { NetworkNodeListScreen } from "@/screens/NetworkNodeListScreen";
import { NetworkNodeDetailScreen } from "@/screens/NetworkNodeDetailScreen";
import { NodeIconCatalogueScreen } from "@/screens/NodeIconCatalogueScreen";
import { ActivityFeedScreen } from "@/screens/ActivityFeedScreen";
import { NodeLocationPanel } from "@/components/NodeLocationPanel";
import { LogoBadge } from "@/components/LogoBadge";
import { useAssetDiscovery } from "@/hooks/useAssetDiscovery";
import { useSpatialPins } from "@/hooks/useSpatialPins";
import { useTribesRefresh } from "@/hooks/useTribesRefresh";
import { CharacterContext } from "@/hooks/useCharacter";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Player-facing standalone page (no sidebar/header) */}
        <Route path="/gate/:gateId" element={<GatePermitPage />} />
        <Route path="/gate" element={<GatePermitPage />} />
        <Route path="/ssu/:ssuId" element={<SsuMarketplacePage />} />
        <Route path="/ssu" element={<SsuMarketplacePage />} />
        <Route path="/dev/node-icon-catalogue" element={<NodeIconCatalogueScreen />} />
        {/* Operator dashboard */}
        <Route path="/*" element={<OperatorShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function OperatorShell() {
  const location = useLocation();
  const [homeRequestToken, setHomeRequestToken] = useState(0);
  const shellLayoutVars = {
    "--operator-sidebar-width": "16rem",
    "--operator-main-gutter": "1.5rem",
  } as CSSProperties;
  const mainScrollStyle = {
    scrollbarGutter: "stable",
  } as CSSProperties;
  const { profile, structures, nodeGroups, metrics, isLoading, isConnected } =
    useAssetDiscovery();
  const { pins, assignPin, removePin } = useSpatialPins();
  useTribesRefresh();

  const handleRequestHome = useCallback(() => {
    setHomeRequestToken((current) => current + 1);
  }, []);

  const characterId = profile?.characterId ?? null;

  return (
    <CharacterContext.Provider value={{ characterId }}>
    <div className="dark min-h-screen bg-background text-foreground" style={shellLayoutVars}>
        <Header characterName={profile?.characterName} onRequestHome={handleRequestHome} />
        <Sidebar
          structures={structures}
          isConnected={isConnected}
          isLoading={isLoading}
          onRequestHome={handleRequestHome}
        />
        <LogoBadge />
        <main className="ml-64 h-screen overflow-y-auto px-6 pb-6 pt-[5.5rem]" style={mainScrollStyle}>
          <div className="max-w-[1760px] mx-auto">
            <ShellRouteTransition location={location} className="min-h-[calc(100vh-8rem)]">
              {(transitionLocation) => (
                <OperatorShellRoutes
                  location={transitionLocation}
                  nodeGroups={nodeGroups}
                  metrics={metrics}
                  pins={pins}
                  structures={structures}
                  isLoading={isLoading}
                  isConnected={isConnected}
                  homeRequestToken={homeRequestToken}
                  onAssignPin={assignPin}
                  onRemovePin={removePin}
                />
              )}
            </ShellRouteTransition>
          </div>
        </main>
    </div>
    </CharacterContext.Provider>
  );
}

interface OperatorShellRoutesProps {
  location: Location;
  nodeGroups: import("@/types/domain").NetworkNodeGroup[];
  metrics: import("@/types/domain").NetworkMetrics;
  pins: import("@/types/domain").SpatialPin[];
  structures: import("@/types/domain").Structure[];
  isLoading: boolean;
  isConnected: boolean;
  homeRequestToken: number;
  onAssignPin: (nodeId: string, systemId: number, systemName: string) => void;
  onRemovePin: (nodeId: string) => void;
}

function OperatorShellRoutes({
  location,
  nodeGroups,
  metrics,
  pins,
  structures,
  isLoading,
  isConnected,
  homeRequestToken,
  onAssignPin,
  onRemovePin,
}: OperatorShellRoutesProps) {
  return (
    <Routes location={location}>
      <Route
        path="/"
        element={
          <Dashboard
            nodeGroups={nodeGroups}
            metrics={metrics}
            pins={pins}
            structures={structures}
            isLoading={isLoading}
            isConnected={isConnected}
            homeRequestToken={homeRequestToken}
          />
        }
      />
      <Route
        path="/gates"
        element={
          <GateListScreen structures={structures} isLoading={isLoading} />
        }
      />
      <Route
        path="/gates/:id"
        element={
          <GateDetailScreen structures={structures} isLoading={isLoading} />
        }
      />
      <Route
        path="/tradeposts"
        element={
          <TradePostListScreen structures={structures} isLoading={isLoading} />
        }
      />
      <Route
        path="/tradeposts/:id"
        element={
          <TradePostDetailScreen structures={structures} isLoading={isLoading} />
        }
      />
      <Route
        path="/turrets"
        element={
          <TurretListScreen structures={structures} isLoading={isLoading} />
        }
      />
      <Route
        path="/turrets/:id"
        element={
          <TurretDetailScreen structures={structures} isLoading={isLoading} />
        }
      />
      <Route
        path="/nodes"
        element={
          <NetworkNodeListScreen structures={structures} nodeGroups={nodeGroups} isLoading={isLoading} />
        }
      />
      <Route
        path="/nodes/:id"
        element={
          <NetworkNodeDetailScreen structures={structures} nodeGroups={nodeGroups} isLoading={isLoading} />
        }
      />
      <Route
        path="/activity"
        element={<ActivityFeedScreen />}
      />
      <Route
        path="/settings"
        element={
          <ConfigurationScreen
            nodeGroups={nodeGroups}
            pins={pins}
            onAssignPin={onAssignPin}
            onRemovePin={onRemovePin}
          />
        }
      />
    </Routes>
  );
}

function ConfigurationScreen({
  nodeGroups,
  pins,
  onAssignPin,
  onRemovePin,
}: {
  nodeGroups: import("@/types/domain").NetworkNodeGroup[];
  pins: import("@/types/domain").SpatialPin[];
  onAssignPin: (nodeId: string, systemId: number, systemName: string) => void;
  onRemovePin: (nodeId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
          Configuration
        </h1>
        <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
          Operator Preferences // Spatial Assignment
        </p>
      </div>
      <NodeLocationPanel
        nodeGroups={nodeGroups}
        pins={pins}
        onAssignPin={onAssignPin}
        onRemovePin={onRemovePin}
      />

      <section className="rounded-lg border border-border/50 bg-card/20 px-4 py-4">
        <div className="border-b border-border/40 pb-3">
          <h2 className="text-sm font-semibold text-foreground">DevTools</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dev-only validation routes for the current origin. These links intentionally use standalone navigation.
          </p>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <a
            href="/dev/node-drilldown-lab"
            className="flex items-center justify-between rounded border border-border/60 bg-background/40 px-3 py-2 transition-colors hover:border-primary/50 hover:text-primary"
          >
            <div>
              <p className="text-sm font-medium text-foreground">Node Drilldown Lab</p>
              <p className="text-[11px] font-mono text-muted-foreground">/dev/node-drilldown-lab</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground/75">Open</span>
          </a>

          <a
            href="/dev/node-icon-catalogue"
            className="flex items-center justify-between rounded border border-border/60 bg-background/40 px-3 py-2 transition-colors hover:border-primary/50 hover:text-primary"
          >
            <div>
              <p className="text-sm font-medium text-foreground">Node Icon Catalogue</p>
              <p className="text-[11px] font-mono text-muted-foreground">/dev/node-icon-catalogue</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground/75">Open</span>
          </a>
        </div>
      </section>
    </div>
  );
}
