/// <reference types="vite/client" />

import type { NodeDrilldownDebugController } from "@/lib/nodeDrilldownIdentity";

declare global {
	interface ImportMetaEnv {
		readonly VITE_SHARED_BACKEND_URL?: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}

	interface Window {
		__CC_NODE_DRILLDOWN_DEBUG__?: NodeDrilldownDebugController;
	}
}

export {};
