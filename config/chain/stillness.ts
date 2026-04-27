/**
 * Stillness chain and package metadata used by the in-repo sponsor worker.
 *
 * WORLD runtime and original package IDs are intentionally the same current
 * Stillness v1 target. A future world-v2 runtime migration must update the
 * runtime ID deliberately without changing current frontend behavior here.
 */

export const STILLNESS_CHAIN_JSON = `{
  "CHAIN_KEY": "stillness",
  "CHAIN_ID": "4c78adac",
  "SUI_RPC_URL": "https://fullnode.testnet.sui.io:443",
  "WORLD_RUNTIME_PACKAGE_ID": "0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c",
  "WORLD_ORIGINAL_PACKAGE_ID": "0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c",
  "CC_PACKAGE_ID": "0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021",
  "CC_ORIGINAL_PACKAGE_ID": "0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021",
  "EVE_ASSETS_PACKAGE_ID": "0x2a66a89b5a735738ffa4423ac024d23571326163f324f9051557617319e59d60",
  "GATE_CONFIG_ID": "0xad76aec886fb85d8e0daad5e375b110cdadd48a8b3439ff76e9601ae39ebe08e",
  "ENERGY_CONFIG_ID": "0xd77693d0df5656d68b1b833e2a23cc81eb3875d8d767e7bd249adde82bdbc952"
}`;

export const STILLNESS_CHAIN = JSON.parse(STILLNESS_CHAIN_JSON) as {
  CHAIN_KEY: string;
  CHAIN_ID: string;
  SUI_RPC_URL: string;
  WORLD_RUNTIME_PACKAGE_ID: string;
  WORLD_ORIGINAL_PACKAGE_ID: string;
  CC_PACKAGE_ID: string;
  CC_ORIGINAL_PACKAGE_ID: string;
  EVE_ASSETS_PACKAGE_ID: string;
  GATE_CONFIG_ID: string;
  ENERGY_CONFIG_ID: string;
};

export const {
  CHAIN_ID,
  CHAIN_KEY,
  CC_ORIGINAL_PACKAGE_ID,
  CC_PACKAGE_ID,
  ENERGY_CONFIG_ID,
  EVE_ASSETS_PACKAGE_ID,
  GATE_CONFIG_ID,
  SUI_RPC_URL,
  WORLD_ORIGINAL_PACKAGE_ID,
  WORLD_RUNTIME_PACKAGE_ID,
} = STILLNESS_CHAIN;