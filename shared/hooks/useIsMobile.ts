import { useMediaQuery } from './useMediaQuery';

const MOBILE_BREAKPOINT = '(max-width: 768px)';

/**
 * Shared hook to check if the current viewport is mobile
 * Centralizes the mobile breakpoint logic
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_BREAKPOINT);
}
