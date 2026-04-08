import React from 'react'
import styles from './RestaurantStatusTag.module.scss'
import OpeningSoonIcon from '../../../../assets/Icons/OpeningSoonIcon'
import OpenNowIcon from '../../../../assets/Icons/OpenNowIcon'
import ClosingSoonIcon from '../../../../assets/Icons/ClosingSoonIcon'
import ClosedIcon from '../../../../assets/Icons/ClosedIcon'

type RestaurantStatus = 'opening-soon' | 'open-now' | 'closing-soon' | 'closed'

interface RestaurantStatusTagProps {
  status: string
}

const getStatusVariant = (status: string): RestaurantStatus => {
  const normalizedStatus = status.toUpperCase()
  
  if (normalizedStatus.includes('OPENING') || normalizedStatus.includes('OPENING IN')) {
    return 'opening-soon'
  }
  if (normalizedStatus.includes('OPEN NOW') || normalizedStatus === 'OPEN NOW') {
    return 'open-now'
  }
  if (normalizedStatus.includes('CLOSING') || normalizedStatus.includes('CLOSING IN')) {
    return 'closing-soon'
  }
  if (normalizedStatus.includes('CLOSED')) {
    return 'closed'
  }
  
  // Default to closed if status doesn't match
  return 'closed'
}

const getStatusIcon = (variant: RestaurantStatus) => {
  switch (variant) {
    case 'opening-soon':
      return <OpeningSoonIcon />
    case 'open-now':
      return <OpenNowIcon />
    case 'closing-soon':
      return <ClosingSoonIcon />
    case 'closed':
      return <ClosedIcon />
    default:
      return <ClosedIcon />
  }
}

const RestaurantStatusTag: React.FC<RestaurantStatusTagProps> = ({ status }) => {
  const variant = getStatusVariant(status)
  
  return (
    <div className={`${styles.restaurantStatusTag} ${styles[variant]}`}>
      <div className={styles.restaurantStatusTagIconContainer}>
        {getStatusIcon(variant)}
      </div>
      <span className={`${styles.restaurantStatusTagText} ${styles[`${variant}Text`]}`}>
        {status}
      </span>
    </div>
  )
}

export default RestaurantStatusTag