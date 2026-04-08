import { showErrorToast } from './toast';
import { isAxiosError } from 'axios';

const DEFAULT_TOAST_MESSAGE = 'Something went wrong';

const extractApiErrorMessage = (error: unknown): string | null => {
  if (isAxiosError(error)) {
    const dataMessage = error.response?.data?.message;
    if (typeof dataMessage === 'string' && dataMessage.trim().length > 0) {
      return dataMessage.trim();
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return null;
};

export const handleCartApiError = (error: unknown, fallback?: string, retryAction?: () => void) => {
  const apiMessage = extractApiErrorMessage(error);
  const toastMessage = apiMessage || DEFAULT_TOAST_MESSAGE;
  showErrorToast(toastMessage, {
    actionLabel: retryAction ? 'Retry' : undefined,
    onAction: retryAction,
  });
  const errorStateMessage = fallback ?? toastMessage;
//   set({ error: errorStateMessage });
  console.error('Cart API error:', toastMessage, error);
};
