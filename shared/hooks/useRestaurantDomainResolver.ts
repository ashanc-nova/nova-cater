import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';

const FALLBACK_REF_ID = "f97af269-ae81-47cb-82c9-a30f90776202";

/** Enterprise subdomain used for API headers on localhost when resolving /store/:storeName (see configs/api). */
export const ENTERPRISE_SUBDOMAIN_LOCAL_FALLBACK = "7leaves-caf-";

const extractSubdomain = (hostname?: string): string | null => {
  if (!hostname) return null;

  const normalized = hostname.trim();
  if (!normalized.includes('.')) return null;

  const [subdomain] = normalized.split('.');
  return subdomain || null;
};

export const useRestaurantDomainResolver = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const hostname = typeof window === 'undefined' ? null : window.location.hostname;

  const subdomain = extractSubdomain(hostname);
  const pathname = location.pathname;

  const refIdFromSearch = searchParams.get('refId');

  let refIdFromPath: string | null = null;

  // detect /store/:storeName
  if (pathname.startsWith('/store/')) {
    const parts = pathname.split('/');
    if (parts.length > 2) {
      refIdFromPath = parts[2];
    }
  }

  // When on /store/:storeName, storeName overrides the hostname subdomain
  // so the API calls v2/{storeName}/details instead of v2/{subdomain}/details
  const effectiveDomainName = refIdFromPath ?? subdomain;

  const refIdToUse = refIdFromPath ?? refIdFromSearch ?? subdomain ?? FALLBACK_REF_ID;

  const shouldRedirectToDefault = !subdomain && !refIdFromSearch && pathname !== '/location';

  const redirectedRef = useRef(false);

  useEffect(() => {
    if (shouldRedirectToDefault && !redirectedRef.current) {
      redirectedRef.current = true;
      navigate(`?refId=${FALLBACK_REF_ID}`, { replace: true });
    }
  }, [navigate, shouldRedirectToDefault]);

  return {
    domainName: effectiveDomainName,
    refIdToUse,
  };
};
