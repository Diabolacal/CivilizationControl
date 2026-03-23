/**
 * useCharacter — React context for the dynamically-resolved character.
 *
 * Provides the current wallet's Character object ID to all PTB builders.
 * Replaces the hardcoded CHARACTER_ID constant in action paths.
 *
 * The character is resolved from the asset discovery pipeline:
 *   wallet → PlayerProfile → characterId
 *
 * All operator-action hooks consume this context to get the correct
 * character for borrow_owner_cap / return_owner_cap calls.
 */

import { createContext, useContext } from "react";
import type { ObjectId } from "@/types/domain";

interface CharacterContextValue {
  /** The current wallet's Character object ID, or null if not yet resolved. */
  characterId: ObjectId | null;
}

export const CharacterContext = createContext<CharacterContextValue>({
  characterId: null,
});

/**
 * Returns the current wallet's Character object ID.
 * Throws if called outside of a CharacterContext provider.
 */
export function useCharacterId(): ObjectId | null {
  const { characterId } = useContext(CharacterContext);
  return characterId;
}

/**
 * Returns the current wallet's Character object ID, throwing if
 * no character has been resolved yet. Use in action hooks that
 * require a valid character to build PTBs.
 */
export function useRequiredCharacterId(): ObjectId {
  const { characterId } = useContext(CharacterContext);
  if (!characterId) {
    throw new Error(
      "No Character resolved for the connected wallet. " +
      "Ensure the wallet owns an EVE Frontier character.",
    );
  }
  return characterId;
}
