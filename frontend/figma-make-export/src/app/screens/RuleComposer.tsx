import React, { useState } from 'react';
import { RuleCard } from '../components/RuleCard';
import { ConfirmationPanel } from '../components/ConfirmationPanel';

export function RuleComposer() {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [rules, setRules] = useState({
    allianceWhitelist: { enabled: true, status: 'active' as const },
    corpBlacklist: { enabled: true, status: 'active' as const },
    shipClassFilter: { enabled: true, status: 'configured' as const },
    baseToll: { enabled: true, status: 'active' as const },
    dynamicPricing: { enabled: false, status: 'off' as const }
  });

  const toggleRule = (ruleKey: string, enabled: boolean) => {
    setRules(prev => ({
      ...prev,
      [ruleKey]: { ...prev[ruleKey as keyof typeof prev], enabled }
    }));
  };

  const handleDeploy = () => {
    setShowConfirmation(false);
    // Mock deployment
    alert('Policy deployed successfully');
  };

  const generatePolicySummary = () => {
    const active = Object.entries(rules).filter(([_, r]) => r.enabled);
    return `This gate allows access to ${active.length} rule modules and charges a base toll of 50 Lux with dynamic pricing based on ship class.`;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">Policy Compiler</h1>
          <p className="text-[11px] font-mono text-muted-foreground tracking-wide">Configure Access & Economic Directives</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Alliance Whitelist */}
        <RuleCard
          title="Alliance Whitelist"
          status={rules.allianceWhitelist.status}
          enabled={rules.allianceWhitelist.enabled}
          onToggle={(enabled) => toggleRule('allianceWhitelist', enabled)}
          lastDeployed="2026-02-17 12:30 UTC"
        >
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-2">Allowed Alliances</label>
            <textarea
              className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded text-sm focus:outline-none focus:border-primary/50 text-foreground font-mono"
              placeholder="Enter alliance IDs (one per line)"
              rows={3}
              defaultValue="Alliance Alpha&#10;Beta Coalition&#10;Gamma Union"
            />
          </div>
        </RuleCard>

        {/* Corporation Blacklist */}
        <RuleCard
          title="Corporation Blacklist"
          status={rules.corpBlacklist.status}
          enabled={rules.corpBlacklist.enabled}
          onToggle={(enabled) => toggleRule('corpBlacklist', enabled)}
          lastDeployed="2026-02-16 18:45 UTC"
        >
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-2">Blocked Corporations</label>
            <textarea
              className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded text-sm focus:outline-none focus:border-primary/50 text-foreground font-mono"
              placeholder="Enter corporation IDs (one per line)"
              rows={3}
            />
          </div>
        </RuleCard>

        {/* Ship Class Filter */}
        <RuleCard
          title="Ship Class Filter"
          status={rules.shipClassFilter.status}
          enabled={rules.shipClassFilter.enabled}
          onToggle={(enabled) => toggleRule('shipClassFilter', enabled)}
          lastDeployed="2026-02-15 09:20 UTC"
        >
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-2">Allowed Ship Classes</label>
            <select className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded text-sm focus:outline-none focus:border-primary/50 text-foreground">
              <option>All Ships</option>
              <option>Frigates Only</option>
              <option>Cruisers and Above</option>
              <option>Capitals Only</option>
            </select>
          </div>
        </RuleCard>

        {/* Base Toll */}
        <RuleCard
          title="Base Toll"
          status={rules.baseToll.status}
          enabled={rules.baseToll.enabled}
          onToggle={(enabled) => toggleRule('baseToll', enabled)}
          lastDeployed="2026-02-17 08:15 UTC"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-2">Amount</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded text-sm focus:outline-none focus:border-primary/50 text-foreground font-mono"
                defaultValue={50}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-2">Currency</label>
              <select className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded text-sm focus:outline-none focus:border-primary/50 text-foreground">
                <option>Lux</option>
                <option>ISK</option>
                <option>EUR</option>
              </select>
            </div>
          </div>
        </RuleCard>

        {/* Dynamic Pricing */}
        <RuleCard
          title="Dynamic Pricing"
          status={rules.dynamicPricing.status}
          enabled={rules.dynamicPricing.enabled}
          onToggle={(enabled) => toggleRule('dynamicPricing', enabled)}
        >
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-2">Price Multiplier</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 bg-muted/10 border border-border/50 rounded text-sm focus:outline-none focus:border-primary/50 text-foreground font-mono"
              defaultValue={1.0}
            />
            <p className="text-[11px] text-muted-foreground mt-3">
              Automatically adjust toll based on traffic volume
            </p>
          </div>
        </RuleCard>
      </div>

      {/* Policy Summary */}
      <div className="bg-[#09090b] border border-border/50 rounded p-5 relative overflow-hidden">
        <h3 className="text-[11px] font-semibold tracking-wide text-foreground mb-3">Compiled Policy Preview</h3>
        <p className="text-sm font-mono text-primary/80 leading-relaxed border-l-2 border-primary pl-4">{generatePolicySummary()}</p>
      </div>

      {/* Deploy Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button className="px-4 py-2.5 bg-muted/10 hover:bg-muted/20 border border-border/50 transition-colors rounded text-[11px] font-medium text-foreground">
          Save Draft
        </button>
        <button
          onClick={() => setShowConfirmation(true)}
          className="px-6 py-2.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors rounded text-[11px] font-medium tracking-wide"
        >
          Execute Policy
        </button>
      </div>

      {/* Confirmation Panel */}
      {showConfirmation && (
        <div className="mt-6 border-t border-border/50 pt-6">
          <ConfirmationPanel
            title="Execute Policy Directive"
            message="This will instantly overwrite the node's current access and economic rules. Proceed with execution?"
            confirmLabel="Execute"
            onConfirm={handleDeploy}
            onCancel={() => setShowConfirmation(false)}
          />
        </div>
      )}
    </div>
  );
}