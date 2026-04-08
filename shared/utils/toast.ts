export type ToastOptions = {
  actionLabel?: string;
  onAction?: () => void;
};

type ToastHandler = (message: string, options?: ToastOptions) => void;

const toastHandler: { current?: ToastHandler } = {};

export const setToastHandler = (handler: ToastHandler | null) => {
  toastHandler.current = handler ?? undefined;
};

export const showToast = (message: string, options?: ToastOptions) => {
  toastHandler.current?.(message, options);
};

type ToastAnchorHandler = (element: HTMLElement | null) => void;
const toastAnchorHandler: { current?: ToastAnchorHandler } = {};

export const setToastAnchorHandler = (handler: ToastAnchorHandler | null) => {
  toastAnchorHandler.current = handler ?? undefined;
};

export const updateToastAnchor = (element: HTMLElement | null) => {
  toastAnchorHandler.current?.(element);
};

const DEFAULT_TOAST_MESSAGE = 'Error message goes here for the toast';

export const showErrorToast = (message?: string, options?: ToastOptions) => {
  const normalized = message?.trim();
  showToast(normalized && normalized.length > 0 ? normalized : DEFAULT_TOAST_MESSAGE, options);
};

