/**
 * App — Root layout shell.
 *
 * Layout: Fixed Header (h-16) + Fixed Sidebar (w-64) + Main content area.
 * Routes follow UX architecture spec §3 screen hierarchy.
 *
 * Data flow: useAssetDiscovery → structures → nodeGroups → child components.
 * Solar system catalog loads in background on mount.
 */

import { BrowserRouter, Routes, Route } from "react-router";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/screens/Dashboard";
import { GateListScreen } from "@/screens/GateListScreen";
import { GateDetailScreen } from "@/screens/GateDetailScreen";
import { TradePostListScreen } from "@/screens/TradePostListScreen";
import { TradePostDetailScreen } from "@/screens/TradePostDetailScreen";
import { TurretListScreen } from "@/screens/TurretListScreen";
import { TurretDetailScreen } from "@/screens/TurretDetailScreen";
import { NetworkNodeListScreen } from "@/screens/NetworkNodeListScreen";
import { NetworkNodeDetailScreen } from "@/screens/NetworkNodeDetailScreen";
import { ActivityFeedScreen } from "@/screens/ActivityFeedScreen";
import { useAssetDiscovery } from "@/hooks/useAssetDiscovery";
import { useSpatialPins } from "@/hooks/useSpatialPins";

export default function App() {
  const { profile, structures, nodeGroups, metrics, isLoading, isConnected } =
    useAssetDiscovery();
  const { pins, assignPin, removePin } = useSpatialPins();

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <BrowserRouter>
        <Header />
        <Sidebar structures={structures} isConnected={isConnected} isLoading={isLoading} />
        <main className="ml-64 mt-16 p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    nodeGroups={nodeGroups}
                    metrics={metrics}
                    pins={pins}
                    isLoading={isLoading}
                    isConnected={isConnected}
                    profile={profile}
                    onAssignPin={assignPin}
                    onRemovePin={removePin}
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
                  <PlaceholderScreen title="Configuration" subtitle="Operator preferences" />
                }
              />
            </Routes>
          </div>
        </main>
      </BrowserRouter>
    </div>
  );
}

function PlaceholderScreen({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-4">
      <div className="border-b border-border/50 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
          {title}
        </h1>
        <p className="text-[11px] font-mono text-muted-foreground tracking-wide">
          {subtitle}
        </p>
      </div>
      <div className="border border-dashed border-border rounded py-16 flex items-center justify-center">
        <p className="text-sm text-muted-foreground/50">
          Implementation in next tranche
        </p>
      </div>
    </div>
  );
}
