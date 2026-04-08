import React from 'react';
import styles from './OrderTags.module.scss';
import CompletedIcon from '../../../assets/Icons/CompletedIcon';
import DeliveredIcon from '../../../assets/Icons/DeliveredIcon';
import ReadyForPickupIcon from '../../../assets/Icons/ReadyForPickupIcon';
import OutForDeliveryIcon from '../../../assets/Icons/OutForDeliveryIcon';
import OrderScheduledIcon from '../../../assets/Icons/OrderScheduledIcon';
import PreparingOrderIcon from '../../../assets/Icons/PreparingOrderIcon';
import OrderDelayedIcon from '../../../assets/Icons/OrderDelayedIcon';
import OrderDeclined from '../../../assets/Icons/OrderDeclined';
import AwaitingConfirmation from '../../../assets/Icons/AwaitingConfirmation';

export type OrderTagKey =
  | 'completed'
  | 'delivered'
  | 'ready-for-pickup'
  | 'out-of-delivery'
  | 'order-scheduled'
  | 'preparing-your-order'
  | 'order-delayed'
  | 'order-declined'
  | 'awaiting-for-confirmation';

interface OrderTagConfig {
  icon: React.ComponentType;
  variant: string;
  displayName: string;
}

const orderTagConfigs: Record<OrderTagKey, OrderTagConfig> = {
  completed: {
    icon: CompletedIcon,
    variant: 'completed',
    displayName: 'Completed',
  },
  delivered: {
    icon: DeliveredIcon,
    variant: 'delivered',
    displayName: 'Delivered',
  },
  'ready-for-pickup': {
    icon: ReadyForPickupIcon,
    variant: 'ready-for-pickup',
    displayName: 'Ready for pickup',
  },
  'out-of-delivery': {
    icon: OutForDeliveryIcon,
    variant: 'out-of-delivery',
    displayName: 'Out of delivery',
  },
  'order-scheduled': {
    icon: OrderScheduledIcon,
    variant: 'order-scheduled',
    displayName: 'Order Scheduled',
  },
  'preparing-your-order': {
    icon: PreparingOrderIcon,
    variant: 'preparing-your-order',
    displayName: 'Preparing your order',
  },
  'order-delayed': {
    icon: OrderDelayedIcon,
    variant: 'order-delayed',
    displayName: 'Order delayed',
  },
  'order-declined': {
    icon: OrderDeclined,
    variant: 'order-declined',
    displayName: 'Order Declined',
  },
  'awaiting-for-confirmation': {
    icon: AwaitingConfirmation,
    variant: 'awaiting-for-confirmation',
    displayName: 'Awaiting confirmation',
  },
};

interface OrderTagsProps {
  tagKey: OrderTagKey;
  tagName?: string;
}

const OrderTags: React.FC<OrderTagsProps> = ({ tagKey, tagName }) => {
  const config = orderTagConfigs[tagKey];

  if (!config) {
    console.warn(`Unknown order tag key: ${tagKey}`);
    return null;
  }

  const IconComponent = config.icon;
  const displayText = tagName || config.displayName;

  return (
    <div className={`${styles.orderTagsWrapper} ${styles[`${config.variant}Wrapper`]}`}>
      <div className={`${styles.orderTags} ${styles[config.variant]}`}>
        <div className={`${styles.orderTagIconContainer} ${styles[`${config.variant}Icon`]}`}>
          <IconComponent />
        </div>
        <span className={styles.orderTagName}>{displayText}</span>
      </div>
    </div>
  );
};

export default OrderTags;
