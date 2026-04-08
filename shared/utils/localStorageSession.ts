const MOBILE_STORAGE_KEYS = ['userPhone', 'currentMobile'];

/**
 * Clears the storage while keeping the mobile identifiers and any addresses that were stored
 * under those mobile numbers. This ensures logout/cleanup flows do not drop saved addresses tied
 * to the current user identifier.
 */
export const clearLocalStoragePreservingMobileAddresses = () => {
  const preservedMobileValues: Record<string, string> = {};
  const mobileNumbersToPreserve = new Set<string>();

  MOBILE_STORAGE_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value) {
      preservedMobileValues[key] = value;
      mobileNumbersToPreserve.add(value);
    }
  });

  const preservedAddressEntries: Record<string, string> = {};
  mobileNumbersToPreserve.forEach((mobileNumber) => {
    const entry = localStorage.getItem(mobileNumber);
    if (entry) {
      preservedAddressEntries[mobileNumber] = entry;
    }
  });

  localStorage.clear();

  Object.entries(preservedMobileValues).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });

  Object.entries(preservedAddressEntries).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
};
