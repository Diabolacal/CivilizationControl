/** Live Stillness object IDs for the owner-authorization harness. */

export const WORLD_PACKAGE_ID =
  "0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c";

export const CC_PACKAGE_ID =
  "0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021";

/**
 * Original (v1) package address — used for type-based queries (DF keys,
 * event type strings, queryEvents MoveModule filter).  On Sui, struct types
 * are always anchored to the package version where they were FIRST DEFINED.
 * On Stillness this is the same as CC_PACKAGE_ID (fresh v1 publish).
 */
export const CC_ORIGINAL_PACKAGE_ID =
  "0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021";

/** Shared GateConfig object — hosts per-gate policy preset dynamic fields. */
export const GATE_CONFIG_ID =
  "0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e";

/** Shared EnergyConfig — required for gate online/offline operations. */
export const ENERGY_CONFIG_ID =
  "0xd77693d0df5656d68b1b833e2a23cc81eb3875d8d767e7bd249adde82bdbc952";

/** Stillness EVE assets package ID. */
export const EVE_ASSETS_PACKAGE_ID =
  "0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60";

/** Fully qualified EVE coin type for RPC queries. */
export const EVE_COIN_TYPE = `${EVE_ASSETS_PACKAGE_ID}::EVE::EVE`;
