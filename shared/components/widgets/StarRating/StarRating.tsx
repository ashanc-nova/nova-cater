import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Lottie from 'lottie-react';
import GenericStarIcon from '../../../../assets/GenericStarIcon';
import { submitOrderRating } from '../../../../services/orderService';
import type { Order } from '../../../../features/orders/types/order';
import firstStarLottie from '../../../../assets/lotties/firstStarLottie.json';
import secondStarLottie from '../../../../assets/lotties/secondStarLottie.json';
import thirdStarLottie from '../../../../assets/lotties/thirdStarLottie.json';
import forthStarLottie from '../../../../assets/lotties/forthStarLottie.json';
import fifthStarLottie from '../../../../assets/lotties/fifthStarLottie.json';

interface StarRatingProps {
  orderRefId: string;
  rating?: number;
}

const MAX_STARS = 5;
const DEBOUNCE_DELAY = 500; // milliseconds

const StarRating: React.FC<StarRatingProps> = ({ orderRefId, rating }) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [optimisticRating, setOptimisticRating] = useState<number | null>(null);
  const [playingAnimation, setPlayingAnimation] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRatingRef = useRef<number | null>(null);
  const snapshotRef = useRef<{
    previousAllOrders: Order[] | undefined;
    previousOngoingOrders: Order[] | undefined;
    previousCompletedOrders: Order[] | undefined;
  } | null>(null);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const ratingMutation = useMutation({
    mutationFn: (newRating: number) => submitOrderRating(orderRefId, newRating),
    onSuccess: () => {
      setHoveredRating(null);
      setOptimisticRating(null);
      snapshotRef.current = null;
      // Invalidate and refetch all order queries to get the latest data from server
      queryClient.invalidateQueries({ queryKey: ['userOrderHistory'] });
    },
    onError: (error) => {
      console.error('Failed to submit rating:', error);
      setOptimisticRating(null);

      // Rollback optimistic updates on error using the stored snapshot
      if (snapshotRef.current) {
        queryClient.setQueryData(['userOrderHistory'], snapshotRef.current.previousAllOrders);
        queryClient.setQueryData(
          ['userOrderHistory', 'ongoing'],
          snapshotRef.current.previousOngoingOrders
        );
        queryClient.setQueryData(
          ['userOrderHistory', 'completed'],
          snapshotRef.current.previousCompletedOrders
        );
        snapshotRef.current = null;
      }
    },
  });

  // Optimistically update UI immediately
  const updateOptimisticUI = useCallback(
    (newRating: number) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      queryClient.cancelQueries({ queryKey: ['userOrderHistory'] });

      // Snapshot the previous values for rollback (before optimistic update)
      snapshotRef.current = {
        previousAllOrders: queryClient.getQueryData<Order[]>(['userOrderHistory']),
        previousOngoingOrders: queryClient.getQueryData<Order[]>(['userOrderHistory', 'ongoing']),
        previousCompletedOrders: queryClient.getQueryData<Order[]>([
          'userOrderHistory',
          'completed',
        ]),
      };

      // Optimistically update all order queries
      const updateOrderRating = (orders: Order[] | undefined): Order[] | undefined => {
        if (!orders) return orders;
        return orders.map((order) =>
          order.orderRefId === orderRefId ? { ...order, rating: newRating } : order
        );
      };

      queryClient.setQueryData<Order[]>(['userOrderHistory'], updateOrderRating);
      queryClient.setQueryData<Order[]>(['userOrderHistory', 'ongoing'], updateOrderRating);
      queryClient.setQueryData<Order[]>(['userOrderHistory', 'completed'], updateOrderRating);

      // Set optimistic rating for immediate UI update
      setOptimisticRating(newRating);
    },
    [orderRefId, queryClient]
  );

  // Debounced function to submit rating
  const debouncedSubmitRating = useCallback(
    (newRating: number) => {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Store the pending rating
      pendingRatingRef.current = newRating;

      // Set a new timer
      debounceTimerRef.current = setTimeout(() => {
        if (pendingRatingRef.current !== null) {
          ratingMutation.mutate(pendingRatingRef.current);
          pendingRatingRef.current = null;
        }
        debounceTimerRef.current = null;
      }, DEBOUNCE_DELAY);
    },
    [ratingMutation]
  );

  const handleStarClick = useCallback(
    (clickedRating: number) => {
      // Update UI immediately for instant feedback
      updateOptimisticUI(clickedRating);

      // Play the corresponding Lottie animation
      setPlayingAnimation(clickedRating);

      // Debounce the API call
      debouncedSubmitRating(clickedRating);
    },
    [updateOptimisticUI, debouncedSubmitRating]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleMouseLeave = () => {
    setHoveredRating(null);
  };

  // Determine which stars should be filled
  // Priority: hovered rating > optimistic rating > prop rating > 0
  const displayRating = hoveredRating ?? optimisticRating ?? rating ?? 0;

  // Map star ratings to their corresponding Lottie animations
  const starAnimations = {
    1: firstStarLottie,
    2: secondStarLottie,
    3: thirdStarLottie,
    4: forthStarLottie,
    5: fifthStarLottie,
  };

  return (
    <div className="flex items-center gap-2 mr-4 md:mr-6 relative" onMouseLeave={handleMouseLeave}>
      {Array.from({ length: MAX_STARS }, (_, idx) => {
        const starValue = idx + 1;
        const isFilled = starValue <= displayRating;
        const isPlaying = playingAnimation === starValue;
        const animationData = starAnimations[starValue as keyof typeof starAnimations];

        return (
          <button
            key={starValue}
            ref={(el) => (starRefs.current[idx] = el)}
            type="button"
            className="relative cursor-pointer transition-opacity hover:opacity-80 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            disabled={false}
            aria-label={`Rate ${starValue} out of 5 stars`}
          >
            {isPlaying && animationData ? (
              <div className="flex items-center justify-center">
                <Lottie
                  animationData={animationData}
                  loop={false}
                  autoplay={true}
                  className="w-5 h-5 md:w-6 md:h-6"
                />
              </div>
            ) : (
              <GenericStarIcon filled={isFilled} size={16} className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
