import { useCallback } from 'react';
import { useSwitchLocationWarningsStore } from '../../features/restaurant/stores/switchLocationWarningsStore';
import type { SwitchLocationWarning } from '../../services/storeSwitchService';
import {
  SWITCH_LOCATION_WARNING_CODES,
  WARNING_PRIORITY_BY_LOCATION,
  type SwitchLocationWarningCode,
} from '../../features/restaurant/config/switchLocationWarningConfig';

export { SWITCH_LOCATION_WARNING_CODES, WARNING_PRIORITY_BY_LOCATION, type SwitchLocationWarningCode };

export interface UseSwitchLocationWarningsReturn {
  /** All warnings from the switch-location API */
  warnings: SwitchLocationWarning[];
  /** Get a warning by its code */
  getWarningByCode: (code: string) => SwitchLocationWarning | undefined;
  /** Get the message to display for a warning (API message only, null if empty - don't show banner) */
  getWarningMessage: (code: string) => string | null;
  /** Check if a warning with the given code exists */
  hasWarningCode: (code: string) => boolean;
  /** True if any warning has requiresScheduleSelection */
  hasRequiresScheduleSelection: boolean;
  /** True if any warning has requiresAddressUpdate */
  hasRequiresAddressUpdate: boolean;
  /** True if any warning has requiresOrderTypeSelection */
  hasRequiresOrderTypeSelection: boolean;
  /** True if any warning has hasUnavailableItems */
  hasUnavailableItems: boolean;
  /** Clear all warnings from the store */
  clearWarnings: () => void;
  /** Clear a specific warning by code (e.g. when user dismisses banner) */
  clearWarningByCode: (code: string) => void;
  /** Clear warnings matching a predicate (e.g. for flag-based warnings) */
  clearWarningsWhere: (predicate: (w: SwitchLocationWarning) => boolean) => void;
  /** Get the single highest-priority warning for a location (first with message). Returns null if none. */
  getPriorityWarning: (
    priorityCodes: readonly string[]
  ) => (SwitchLocationWarning & { code: string; message: string }) | null;
}

/**
 * Hook to read switch-location warnings from Zustand store.
 * Warnings are set by useStoreSwitchLocation when the user switches store with items in cart.
 *
 * Use in any page/component that needs to display switch-location warnings.
 * See switchLocationWarningConfig.ts for which codes are used where.
 */
export const useSwitchLocationWarnings = (): UseSwitchLocationWarningsReturn => {
  const warnings = useSwitchLocationWarningsStore((s) => s.warnings);
  const clearWarnings = useSwitchLocationWarningsStore((s) => s.clearWarnings);
  const clearWarningByCode = useSwitchLocationWarningsStore((s) => s.clearWarningByCode);
  const clearWarningsWhere = useSwitchLocationWarningsStore((s) => s.clearWarningsWhere);

  const getWarningByCode = useCallback(
    (code: string) => warnings.find((w) => w.code === code),
    [warnings]
  );

  const getWarningMessage = useCallback(
    (code: string): string | null => {
      const warning = getWarningByCode(code);
      const msg = warning?.message?.trim();
      return msg || null;
    },
    [getWarningByCode]
  );

  const hasWarningCode = useCallback(
    (code: string) => warnings.some((w) => w.code === code),
    [warnings]
  );

  const hasRequiresScheduleSelection = warnings.some((w) => w.requiresScheduleSelection === true);
  const hasRequiresAddressUpdate = warnings.some((w) => w.requiresAddressUpdate === true);
  const hasRequiresOrderTypeSelection = warnings.some(
    (w) => w.requiresOrderTypeSelection === true
  );
  const hasUnavailableItems = warnings.some((w) => w.hasUnavailableItems === true);

  const getPriorityWarning = useCallback(
    (priorityCodes: readonly string[]): (SwitchLocationWarning & { code: string; message: string }) | null => {
      for (const code of priorityCodes) {
        const warning = getWarningByCode(code);
        const message = warning?.message?.trim();
        if (warning && message) return { ...warning, code, message };
      }
      return null;
    },
    [getWarningByCode]
  );

  return {
    warnings,
    getWarningByCode,
    getWarningMessage,
    hasWarningCode,
    hasRequiresScheduleSelection,
    hasRequiresAddressUpdate,
    hasRequiresOrderTypeSelection,
    hasUnavailableItems,
    clearWarnings,
    clearWarningByCode,
    clearWarningsWhere,
    getPriorityWarning,
  };
};
