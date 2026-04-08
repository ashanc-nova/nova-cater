import { useMemo } from 'react';
import { buildFallbackSvgDataUrl } from '../utils/buildBrandFallbacksvg';

export const useBrandFallbackImage = () => {
  return useMemo(() => {
    const brand300 = getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-300')
      .trim();

    return buildFallbackSvgDataUrl(brand300);
  }, []);
};
