import type { SignalCategory, SignalEvent } from "@/types/domain";

export type SignalHistoryCategory = SignalCategory;

export interface SignalHistoryQuery {
  walletAddress: string;
  limit?: number;
  categories?: SignalHistoryCategory[];
  cursor?: string | null;
  networkNodeId?: string | null;
  structureId?: string | null;
  since?: string | null;
}

export interface SignalHistoryOperator {
  walletAddress: string | null;
  characterId: string | null;
  characterName: string | null;
  tribeId: number | null;
  tribeName: string | null;
}

export interface SignalHistoryPage {
  schemaVersion: "signal-history.v1";
  source: string | null;
  fetchedAt: string | null;
  partial: boolean;
  warnings: string[];
  operator: SignalHistoryOperator | null;
  signals: SignalEvent[];
  nextCursor: string | null;
}