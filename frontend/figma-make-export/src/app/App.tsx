import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './screens/Dashboard';
import { GateList } from './screens/GateList';
import { GateDetail } from './screens/GateDetail';
import { RuleComposer } from './screens/RuleComposer';
import { TradePostDetail } from './screens/TradePostDetail';
import { ActivityFeed } from './screens/ActivityFeed';
import { Settings } from './screens/Settings';

export default function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <BrowserRouter>
        <Header />
        <Sidebar />
        <main className="ml-64 mt-16 p-8 min-h-[calc(100vh-4rem)]">
          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gates" element={<GateList />} />
              <Route path="/gates/:id" element={<GateDetail />} />
              <Route path="/gates/:id/rules" element={<RuleComposer />} />
              <Route path="/tradeposts" element={<div className="space-y-6"><h1>TradePosts</h1><p className="text-sm text-muted-foreground">TradePost list view</p></div>} />
              <Route path="/tradeposts/:id" element={<TradePostDetail />} />
              <Route path="/activity" element={<ActivityFeed />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </BrowserRouter>
    </div>
  );
}