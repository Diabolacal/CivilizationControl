/**
 * useAdminCapOwner — Reads the on-chain owner of the GateControl AdminCap.
 *
 * Returns the owner address so callers can compare it to the connected
 * wallet and block policy/posture mutations when the AdminCap belongs
 * to a different wallet (e.g. the publisher after a fresh publish).
 */

import { useQuery } from "@tanstack/react-query";
import { fetchAdminCapOwner } from "@/lib/suiReader";
import { GATE_ADMIN_CAP_ID } from "@/constants";

export function useAdminCapOwner() {
  return useQuery({
    queryKey: ["adminCapOwner", GATE_ADMIN_CAP_ID],
    queryFn: () => fetchAdminCapOwner(GATE_ADMIN_CAP_ID),
    staleTime: 60_000,
  });
}
