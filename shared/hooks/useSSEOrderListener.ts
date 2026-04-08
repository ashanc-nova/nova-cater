import { useState, useEffect, useRef, useCallback } from 'react';
import { ROOT_DOMAIN } from '../../configs/environments/config';
import { isLoggedIn, removeUserToken } from '../../services/tokenServices';
import { createSSEConnection } from '../../shared/utils/sseUtils';

/**
 * SSE Order Data Interface
 * Represents the data structure received from SSE events
 */
interface SSEOrderData {
  orderRefId: string;
  orderStatus: string;
  [key: string]: any;
}

/**
 * SSE Event Types
 * Defines all possible event types from the SSE stream
 */
const SSEEventType = {
  CONNECTED: 'connected',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  ORDER_COMPLETE: 'ORDER_COMPLETE',
  CLOSE: 'close',
  SHUTDOWN: 'shutdown',
} as const;

/**
 * Hook Props Interface
 */
interface UseSSEOrderListenerProps {
  cartRefId: string;
  enabled?: boolean;
  apiBaseUrl?: string;
  onOrderComplete?: (data: SSEOrderData) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook Return Interface
 */
interface UseSSEOrderListenerReturn {
  orderData: SSEOrderData | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
  connectionAttempts: number;
  maxReconnectAttempts: number;
}

/**
 * Constants
 */
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

/**
 * Calculate exponential backoff delay for reconnection attempts
 *
 * @param attempt - Current reconnection attempt number
 * @returns Delay in milliseconds
 */
const calculateReconnectDelay = (attempt: number): number => {
  return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
};

/**
 * Parse SSE message and extract event type and data
 *
 * @param message - Raw SSE message string
 * @returns Tuple of [eventType, eventData] or null if parsing fails
 */
const parseSSEMessage = (message: string): [string, any] | null => {
  const eventMatch = message.match(/^event:\s*(.+)$/m);
  const dataMatch = message.match(/^data:\s*(.+)$/m);

  if (!eventMatch || !dataMatch) {
    return null;
  }

  const eventType = eventMatch[1].trim();
  const eventDataStr = dataMatch[1].trim();

  try {
    const eventData = JSON.parse(eventDataStr);
    return [eventType, eventData];
  } catch (error) {
    console.error('[SSE] Error parsing event data:', error);
    return null;
  }
};

/**
 * Custom hook for listening to SSE order updates
 *
 * This hook manages the SSE connection lifecycle, handles reconnection logic,
 * and provides a clean interface for consuming order updates.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Error handling and reporting
 * - Manual reconnection capability
 *
 * @param props - Hook configuration options
 * @returns Hook state and control functions
 */
export const useSSEOrderListener = ({
  cartRefId,
  enabled = true,
  apiBaseUrl = ROOT_DOMAIN,
  onOrderComplete,
  onError,
}: UseSSEOrderListenerProps): UseSSEOrderListenerReturn => {
  // State management
  const [orderData, setOrderData] = useState<SSEOrderData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Refs for managing connection lifecycle
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Cleanup function to close connections and clear timeouts
   */
  const cleanup = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel().catch(console.error);
      readerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  /**
   * Handle successful SSE connection
   */
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setConnectionAttempts(0);
    setError(null);
  }, []);

  /**
   * Handle order completion event
   */
  const handleOrderComplete = useCallback(
    (eventData: SSEOrderData) => {
      setOrderData(eventData);
      setError(null);

      if (onOrderComplete) {
        onOrderComplete(eventData);
      }
    },
    [onOrderComplete]
  );

  /**
   * Handle connection closure
   */
  const handleConnectionClose = useCallback(() => {
    setIsConnected(false);
  }, []);

  /**
   * Handle SSE event based on event type
   */
  const handleSSEEvent = useCallback(
    (eventType: string, eventData: any) => {
      switch (eventType) {
        case SSEEventType.CONNECTED:
          handleConnected();
          break;

        case SSEEventType.PAYMENT_SUCCESS:
        case SSEEventType.ORDER_COMPLETE:
          handleOrderComplete(eventData as SSEOrderData);
          break;

        case SSEEventType.CLOSE:
        case SSEEventType.SHUTDOWN:
          handleConnectionClose();
          break;

        default:
          console.log('[SSE] Unknown event type:', eventType);
      }
    },
    [handleConnected, handleOrderComplete, handleConnectionClose]
  );

  /**
   * Schedule reconnection attempt
   */
  const scheduleReconnect = useCallback(() => {
    if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    const delay = calculateReconnectDelay(connectionAttempts);
    console.log(
      `[SSE] Reconnecting in ${delay}ms... (Attempt ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionAttempts((prev) => prev + 1);
    }, delay);
  }, [connectionAttempts]);

  /**
   * Handle connection errors
   */
  const handleConnectionError = useCallback(
    (err: Error) => {
      console.error('[SSE] Connection error:', err);

      // Check if it's an authentication error
      if ((err as any).status === 401) {
        console.error('[SSE] Authentication failed - token may be invalid or expired');

        // Handle 401 similar to axios interceptor
        if (isLoggedIn()) {
          removeUserToken();
        }
      }

      setError(err);
      setIsConnected(false);

      if (onError) {
        onError(err);
      }

      scheduleReconnect();
    },
    [onError, scheduleReconnect]
  );

  /**
   * Process incoming SSE stream
   */
  const processStream = useCallback(
    async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            setIsConnected(false);
            scheduleReconnect();
            break;
          }

          // Decode and buffer incoming data
          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          // Process each complete message
          for (const message of messages) {
            if (message.trim() === '') continue;

            const parsed = parseSSEMessage(message);
            if (parsed) {
              const [eventType, eventData] = parsed;
              handleSSEEvent(eventType, eventData);
            }
          }
        }
      } catch (streamError) {
        console.error('[SSE] Stream processing error:', streamError);
        handleConnectionError(streamError as Error);
      }
    },
    [handleSSEEvent, handleConnectionError, scheduleReconnect]
  );

  /**
   * Establish SSE connection using createSSEConnection utility
   * Uses fetch directly with proper authentication headers (no axios)
   */
  const connect = useCallback(async () => {
    if (!cartRefId || !enabled) {
      return;
    }

    cleanup();

    try {
      // Build the request URL
      const url = `${apiBaseUrl}/unified/sse/subscribe/${cartRefId}`;

      // Use createSSEConnection utility to create fetch-based SSE connection
      // This handles: session token init, auth token, restaurant IDs, and all headers
      const response = await createSSEConnection(url);

      // Get the stream reader and process SSE events
      const reader = response.body!.getReader();
      readerRef.current = reader;
      await processStream(reader);
    } catch (err) {
      console.error('[SSE] Connection failed:', err);
      handleConnectionError(err as Error);
    }
  }, [cartRefId, enabled, apiBaseUrl, cleanup, processStream, handleConnectionError]);

  /**
   * Manual reconnection function
   */
  const reconnect = useCallback(() => {
    setConnectionAttempts(0);
    setError(null);
    connect();
  }, [connect]);

  /**
   * Effect to manage connection lifecycle
   */
  useEffect(() => {
    if (enabled && cartRefId) {
      connect();
    }

    return () => {
      cleanup();
    };
  }, [enabled, cartRefId, connectionAttempts, connect, cleanup]);

  return {
    orderData,
    isConnected,
    error,
    reconnect,
    connectionAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
  };
};
