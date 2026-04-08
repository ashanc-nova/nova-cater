/**
 * SSE Connection Utility
 * Creates an SSE connection using fetch with proper authentication headers
 * Replicates axios interceptor logic without using axios
 */

import { initializeSessionToken, getActiveToken } from '../../services/tokenServices';
import { restaurantService } from '../../services/restaurantService';

/**
 * Create SSE connection with proper authentication headers
 * This function replicates the axios interceptor logic:
 * 1. Initialize session token
 * 2. Get active token (user token > session token)
 * 3. Get restaurant IDs
 * 4. Create fetch request with all headers
 *
 * @param url - The SSE endpoint URL
 * @returns Promise<Response> - Fetch Response object with streaming body
 */
// Needed to create separate function as axios does not support SSE connections
export const createSSEConnection = async (url: string): Promise<Response> => {
  try {
    // Step 1: Initialize session token (same as axios interceptor)
    await initializeSessionToken();

    // Step 2: Get active token (user token > session token)
    const token = getActiveToken();
    if (!token) {
      throw new Error('No authentication token available after initialization');
    }

    // Step 3: Get restaurant IDs (same as axios interceptor)
    // SSE is not a restaurant details call, so we need restaurant IDs
    const { businessRefId, restaurantRefId } = await restaurantService.ensureRestaurantIds();

    // Step 4: Build headers (same as axios interceptor + SSE-specific headers)
    const headers: Record<string, string> = {
      // Authentication
      Authorization: `Bearer ${token}`,

      // Restaurant context
      businessRefId: businessRefId,
      restaurantRefId: restaurantRefId,

      // Standard headers (from axios defaults)
      'Content-Type': 'application/json',
      'application-name': 'WMA.Web',

      // SSE-specific headers
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    };

    // Step 5: Make fetch request with all configured headers

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      throw error;
    }

    if (!response.body) {
      throw new Error('No response body available for SSE stream');
    }

    return response;
  } catch (error) {
    console.error('[SSE] Failed to create SSE connection:', error);
    throw error;
  }
};
