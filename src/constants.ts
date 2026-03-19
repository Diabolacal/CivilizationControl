/** Live Utopia object IDs for the owner-authorization harness. */

export const WORLD_PACKAGE_ID =
  "0xd12a70c74c1e759445d6f209b01d43d860e97fcf2ef72ccbbd00afd828043f75";

export const CC_PACKAGE_ID =
  "0x0f2846d52cdd9c52ec9ced3f0378032718a7ccda013b36d0f6796fcf1bee9adc";

/**
 * Original (v1) package address — used for type-based queries (DF keys,
 * event type strings, queryEvents MoveModule filter).  On Sui, struct types
 * are always anchored to the original-id even after package upgrades.
 */
export const CC_ORIGINAL_PACKAGE_ID =
  "0x0f2846d52cdd9c52ec9ced3f0378032718a7ccda013b36d0f6796fcf1bee9adc";

/** Shared GateConfig object — hosts per-gate rule dynamic fields. */
export const GATE_CONFIG_ID =
  "0x81e3ef33f489a049df27f5464a3c25dd865991d4e5e9d70a58413feab29d8d4f";

/** GateControl AdminCap — required for policy mutations. */
export const GATE_ADMIN_CAP_ID =
  "0xeba584423e82098457628c43295ef25a3e048b4cceaa486783e1ee841093f067";

export const CHARACTER_ID =
  "0x9162fb775028fb0ea0479d8e6187040403d1a7388b2abda3c19aab1539893110";

export const GATE_ID =
  "0xf13071441b28507485782c8bf4f45c5596f2d0e14230ad9f684d8e76da311b68";

export const GATE_OWNER_CAP_ID =
  "0xa107699ef73b9ed369dfb15dbebdaa2ab9f36da0b63616a2af94c0117906f80a";

export const SSU_ID =
  "0x73a260bd3de57c46d390a18abe797dc1d24a166c383e871e2abc46ba996bf121";

export const SSU_OWNER_CAP_ID =
  "0x3865b72888b59d05d18fda3bf590afe4e04d7721bb989cd59f30e4e0a3d36e6d";

/** Shared EnergyConfig — required for gate online/offline operations. */
export const ENERGY_CONFIG_ID =
  "0x9285364e8104c04380d9cc4a001bbdfc81a554aad441c2909c2d3bd52a0c9c62";

/** Publisher / operator treasury address — toll revenue destination. */
export const TREASURY_ADDRESS =
  "0xacff13b0630890ac9de62c57ec542de7cad8778aec1fe24f9db19f2457ad54b1";

/** Utopia EVE assets package ID. */
export const EVE_ASSETS_PACKAGE_ID =
  "0xf0446b93345c1118f21239d7ac58fb82d005219b2016e100f074e4d17162a465";

/** Fully qualified EVE coin type for RPC queries. */
export const EVE_COIN_TYPE = `${EVE_ASSETS_PACKAGE_ID}::EVE::EVE`;
