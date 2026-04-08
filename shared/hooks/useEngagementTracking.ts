import { useEffect, useRef } from 'react';
import { trackUserEngagement, trackSessionStart } from '../utils/analytics';
import { isLoggedIn } from '../../services/tokenServices';

interface UseEngagementTrackingOptions {
  restaurantId?: string;
  userId?: string;
  trackingInterval?: number; // milliseconds, default 10000 (10 seconds)
  minEngagementTime?: number; // minimum time to track on unmount, default 1000ms
}

export const useEngagementTracking = (options: UseEngagementTrackingOptions = {}) => {
  const { restaurantId, userId, trackingInterval = 10000, minEngagementTime = 1000 } = options;

  const startTimeRef = useRef<number>(Date.now());
  const lastTrackedTimeRef = useRef<number>(0);
  const engagementTimerRef = useRef<NodeJS.Timeout>();
  const hasTrackedSessionRef = useRef<boolean>(false);

  useEffect(() => {
    // Determine user type
    const userIsLoggedIn = isLoggedIn();
    const userType = userIsLoggedIn ? 'logged_in' : 'guest';
    const effectiveUserId = userIsLoggedIn ? userId : undefined;

    // Track session start (only once per mount)
    if (!hasTrackedSessionRef.current) {
      trackSessionStart(restaurantId, effectiveUserId, userType);
      hasTrackedSessionRef.current = true;
    }

    // Reset start time
    startTimeRef.current = Date.now();
    lastTrackedTimeRef.current = 0;

    // Track engagement periodically
    const trackEngagement = () => {
      const currentTime = Date.now();
      const elapsedSinceStart = currentTime - startTimeRef.current;
      const elapsedSinceLastTrack =
        currentTime - (lastTrackedTimeRef.current || startTimeRef.current);

      // Only track if there's meaningful engagement (more than 1 second since last track)
      if (elapsedSinceLastTrack > 1000) {
        trackUserEngagement(elapsedSinceStart, restaurantId, effectiveUserId, userType);
        lastTrackedTimeRef.current = currentTime;
      }
    };

    // Set up periodic tracking
    engagementTimerRef.current = setInterval(trackEngagement, trackingInterval);

    // Cleanup function
    return () => {
      if (engagementTimerRef.current) {
        clearInterval(engagementTimerRef.current);
      }

      // Track final engagement on unmount
      const totalTime = Date.now() - startTimeRef.current;
      if (totalTime > minEngagementTime) {
        trackUserEngagement(totalTime, restaurantId, effectiveUserId, userType);
      }
    };
  }, [restaurantId, userId, trackingInterval, minEngagementTime]);
};
