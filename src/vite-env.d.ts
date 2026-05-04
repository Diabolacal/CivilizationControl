/// <reference types="vite/client" />

import type { NodeDrilldownDebugController } from "@/lib/nodeDrilldownIdentity";
import type { OperatorInventoryDebugController } from "@/lib/operatorInventoryDebug";
import type { StructureWriteDebugController } from "@/lib/structureWriteReconciliation";

declare global {
	interface ImportMetaEnv {
		readonly VITE_SHARED_BACKEND_URL?: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}

	interface Window {
		__CC_NODE_DRILLDOWN_DEBUG__?: NodeDrilldownDebugController;
		__CC_OPERATOR_INVENTORY_DEBUG__?: OperatorInventoryDebugController;
		__CC_STRUCTURE_WRITE_DEBUG__?: StructureWriteDebugController;
	}
}

export {};
