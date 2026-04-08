import React from 'react';
import type { OrderStatus, OrderType } from '../../../../features/orders/types/order';
import { ORDER_TYPE_VS_STEPS } from '../../../../features/orders/configs/orderTypeVsSteps';
import Lottie from 'lottie-react';
import orderBeingPreparedProgressBar from '../../../../assets/lotties/orderBeingPreparedProgressBar.json';
import orderReadyForPickupProgressBar from '../../../../assets/lotties/orderReadyForPickupProgressBar.json';
import orderPickedUpProgressBar from '../../../../assets/lotties/orderPickedUpProgressBar.json';
import awaitingConfirmationProgressBar from '../../../../assets/lotties/awaitingConfirmationProgressBar.json';
import StatusCompleteTick from '../../../../assets/Icons/StatusCompleteTick';
import styles from './ProgressTracker.module.scss';

const TAKEAWAY_STATUS_TO_STEP_INDEX: Record<OrderStatus, number> = {
  'Yet to accept': 0, // Awaiting confirmation
  Accepted: 1, // Order being prepared
  Cooking: 1, // Order being prepared
  Packing: 1, // Order being prepared
  'Ready to serve': 2, // Order ready for pickup
  'Ready to pickup': 2, // Order ready for pickup
  'Ready to pay': 2, // Order ready for pickup
  'Picked up': 3, // Order picked up
  Served: 3, // Order picked up (completed)
  // Closed order statuses
  Delivered: 3, // Order picked up (completed)
  Declined: -1,
  Cancelled: -1,
  Voided: -1,
  'Unable to deliver': -1,
  'Ready to deliver': 2, // Not applicable for TakeAway, but map to ready for pickup
  'Out for delivery': 2, // Not applicable for TakeAway, but map to ready for pickup
};

const DELIVERY_STATUS_TO_STEP_INDEX: Record<OrderStatus, number> = {
  'Yet to accept': 0, // Awaiting confirmation
  Accepted: 1, // Order being prepared (Order confirmed)
  Cooking: 1, // Order being prepared
  Packing: 1, // Order being prepared
  'Ready to serve': 1, // Order being prepared (ready_for_pickup step removed)
  'Ready to pickup': 1, // Order being prepared (ready_for_pickup step removed)
  'Ready to pay': 1, // Order being prepared (ready_for_pickup step removed)
  'Ready to deliver': 2, // Out for delivery (was step 3, now step 2)
  'Picked up': 2, // Out for delivery (was step 3, now step 2)
  'Out for delivery': 2, // Out for delivery (was step 3, now step 2)
  Delivered: 3, // Order delivered (was step 4, now step 3)
  Served: 3, // Order delivered (was step 4, now step 3)
  // Closed order statuses
  Declined: -1,
  Cancelled: -1,
  Voided: -1,
  'Unable to deliver': -1,
};

const getStatusToStepIndexMap = (orderType: OrderType): Record<OrderStatus, number> => {
  // Normalize orderType: "delivery" or "Delivery" -> delivery, "TakeAway" -> TakeAway
  const normalizedType = orderType?.toLowerCase() === 'delivery' ? 'delivery' : 'TakeAway';
  return normalizedType === 'delivery'
    ? DELIVERY_STATUS_TO_STEP_INDEX
    : TAKEAWAY_STATUS_TO_STEP_INDEX;
};

const getLastHighlightedStepIndex = (status: OrderStatus, orderType: OrderType): number => {
  const statusMap = getStatusToStepIndexMap(orderType);
  return statusMap[status] ?? -1;
};

const getProgressSteps = (status: OrderStatus, orderType: OrderType) => {
  // Normalize orderType to match ORDER_TYPE_VS_STEPS keys: "Delivery" or "TakeAway"
  const normalizedOrderType = orderType?.toLowerCase() === 'delivery' ? 'Delivery' : 'TakeAway';
  const steps = ORDER_TYPE_VS_STEPS[normalizedOrderType];
  const lastHighlightedIndex = getLastHighlightedStepIndex(status, orderType);

  return steps.map((step, index) => ({
    ...step,
    isCompleted: index <= lastHighlightedIndex,
    isActive: index === lastHighlightedIndex && lastHighlightedIndex >= 0,
  }));
};

// This Component is responsible for indicating the appropriate status of the order
// With the animating loaders for the steps which add wow element to the UI/UX.
// Steps are predeterminted based on the type of the order
const ProgressTracker = ({
  orderStatus,
  orderType,
}: {
  orderStatus: OrderStatus;
  orderType: OrderType;
}) => {
  const progressSteps = getProgressSteps(orderStatus, orderType);
  const getLabelColor = (isCompleted: boolean, isActive: boolean) => {
    if (isActive || isCompleted) return 'text-[var(--color-type-brand)]';
    return 'text-[#9DA3B7]';
  };

  const getIconWrapperClassName = (isCompleted: boolean, isActive: boolean) => {
    if (isActive) {
      return '';
    }
    if (isCompleted) {
      return '';
    }
    return 'bg-white border border-[#F1F3F9] opacity-80';
  };

  return (
    <div className={`${styles.container} px-4 pt-2 md:px-5 md:py-5`}>
      {/* Mobile: Vertical Layout */}
      <div className="relative md:hidden">
        {progressSteps.map((step, index) => {
          const isActive = step.isCompleted || step.isActive;
          const IconComponent = isActive ? step.iconActive : step.iconInactive;
          // Show Lottie animation only for active steps that are not yet completed
          // Once a step is completed, show the tick instead of Lottie
          const isCompleted = step.isCompleted;
          const isLastStep = index === progressSteps.length - 1;
          const isAwaitingConfirmation =
            step.key === 'awaiting_confirmation' && step.isActive && !isCompleted;
          const isOrderBeingPrepared =
            step.key === 'order_confirmed' && step.isActive && !isCompleted;
          const isOrderReadyForPickup =
            step.key === 'ready_for_pickup' && step.isActive && !isCompleted;
          const isOrderPickedUp = step.key === 'picked_up' && step.isActive && !isCompleted;
          // Show tick only for previous completed states, or for current state if it's the last stage
          const shouldShowTick =
            step.isCompleted && (!step.isActive || (step.isActive && isLastStep));

          // Determine if connector should be blue (gradient)
          // Connector should be blue only if current step is completed AND not active
          // This means the line goes from first state to the last completed state (before current active)
          const shouldShowBlueConnector = step.isCompleted && !step.isActive;

          return (
            <div key={step.key} className={styles.mobileStep}>
              <div className={styles.mobileIconContainer}>
                <div className="relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${getIconWrapperClassName(
                      step.isCompleted,
                      step.isActive
                    )}`}
                  >
                    {isAwaitingConfirmation ? (
                      <Lottie
                        animationData={awaitingConfirmationProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : isOrderBeingPrepared ? (
                      <Lottie
                        animationData={orderBeingPreparedProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : isOrderReadyForPickup ? (
                      <Lottie
                        animationData={orderReadyForPickupProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : isOrderPickedUp ? (
                      <Lottie
                        animationData={orderPickedUpProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <IconComponent />
                    )}
                  </div>
                  {shouldShowTick && (
                    <div className={styles.completeTick}>
                      <StatusCompleteTick />
                    </div>
                  )}
                </div>
                {index < progressSteps.length - 1 && (
                  <div
                    className={`${styles.mobileConnector} ${shouldShowBlueConnector ? styles.gradientConnectorVertical : styles.inactiveConnector}`}
                  />
                )}
              </div>

              <div className={styles.stepLabel}>
                <p
                  className={`text-[12px] leading-[18px] tracking-[0.05px] md:text-sm font-medium leading-5 tracking-[-0.05px] ${getLabelColor(
                    step.isCompleted,
                    step.isActive
                  )}`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:block">
        <div className={styles.desktopStepsContainer}>
          {progressSteps.map((step, index) => {
            const isActive = step.isCompleted || step.isActive;
            const IconComponent = isActive ? step.iconActive : step.iconInactive;
            const isLastStep = index === progressSteps.length - 1;
            // Show Lottie animation only for active steps that are not yet completed
            // Once a step is completed, show the tick instead of Lottie
            const isCompleted = step.isCompleted;
            const isAwaitingConfirmation =
              step.key === 'awaiting_confirmation' && step.isActive && !isCompleted;
            const isOrderBeingPrepared =
              step.key === 'order_confirmed' && step.isActive && !isCompleted;
            const isOrderReadyForPickup =
              step.key === 'ready_for_pickup' && step.isActive && !isCompleted;
            const isOrderPickedUp = step.key === 'picked_up' && step.isActive && !isCompleted;
            // Show tick only for previous completed states, or for current state if it's the last stage
            const shouldShowTick =
              step.isCompleted && (!step.isActive || (step.isActive && isLastStep));

            // Determine if connector should be blue (gradient)
            // Connector should be blue only if current step is completed AND not active
            // This means the line goes from first state to the last completed state (before current active)
            const shouldShowBlueConnector = step.isCompleted && !step.isActive;

            return (
              <div key={step.key} className={styles.desktopStep}>
                {!isLastStep && (
                  <div
                    className={`${styles.desktopConnectorBetween} ${shouldShowBlueConnector ? styles.gradientConnector : styles.inactiveConnector}`}
                  />
                )}
                <div className="relative">
                  <div
                    className={`relative z-10 mb-2 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${getIconWrapperClassName(
                      step.isCompleted,
                      step.isActive
                    )}`}
                  >
                    {isAwaitingConfirmation ? (
                      <Lottie
                        animationData={awaitingConfirmationProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : isOrderBeingPrepared ? (
                      <Lottie
                        animationData={orderBeingPreparedProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : isOrderReadyForPickup ? (
                      <Lottie
                        animationData={orderReadyForPickupProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : isOrderPickedUp ? (
                      <Lottie
                        animationData={orderPickedUpProgressBar}
                        loop={true}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <IconComponent />
                    )}
                  </div>
                  {shouldShowTick && (
                    <div className={styles.completeTick}>
                      <StatusCompleteTick />
                    </div>
                  )}
                </div>

                <p
                  className={`text-[12px] font-medium leading-[18px] tracking-[0.05px] whitespace-pre-line text-center ${getLabelColor(
                    step.isCompleted,
                    step.isActive
                  )}`}
                >
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
