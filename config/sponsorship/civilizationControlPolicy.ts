/**
 * Declarative sponsor-worker allowlist for current CivilizationControl
 * sponsored governance PTBs on Stillness.
 */

export const CIVILIZATION_CONTROL_POLICY_JSON = `{
  "id": "civilization-control",
  "maxCommands": 200,
  "packages": {
    "0xd2fd1224f881e7a705dbc211888af11655c315f2ee0f03fe680fc3176e6e4780": {
      "character": ["borrow_owner_cap", "return_owner_cap"],
      "gate": ["authorize_extension", "update_metadata_url", "online", "offline"],
      "storage_unit": ["authorize_extension", "update_metadata_url", "online", "offline"],
      "turret": ["authorize_extension", "online", "offline"],
      "network_node": ["online"]
    },
    "0x28b497559d65ab320d9da4613bf2498d5946b2c0ae3597ccfda3072ce127448c": {
      "character": ["borrow_owner_cap", "return_owner_cap"],
      "gate": ["authorize_extension", "update_metadata_url", "online", "offline"],
      "storage_unit": ["authorize_extension", "update_metadata_url", "online", "offline"],
      "turret": ["authorize_extension", "online", "offline"],
      "network_node": ["online"]
    },
    "0x902948c11c7291a7b64d150291283548dad878c84b6a0db279c57535d5971021": {
      "gate_control": [
        "set_policy_preset",
        "remove_policy_preset",
        "set_treasury",
        "request_jump_permit_free",
        "request_jump_permit"
      ],
      "posture": ["set_posture"],
      "trade_post": [
        "create_listing",
        "share_listing",
        "cancel_listing",
        "buy_to_inventory"
      ]
    }
  }
}`;

export const CIVILIZATION_CONTROL_POLICY = JSON.parse(
  CIVILIZATION_CONTROL_POLICY_JSON,
) as {
  id: string;
  maxCommands: number;
  packages: Record<string, Record<string, string[]>>;
};