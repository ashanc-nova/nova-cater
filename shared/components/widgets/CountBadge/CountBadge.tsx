import React from 'react';
import styles from './CountBadge.module.scss';

interface CountBadgeProps {
    count: number;
    size: number | string;
}
const CountBadge = ({ count, size }: CountBadgeProps) => {
    return (
        <div className={styles.countBadge} style={{ width: size, height: size }}>
            <span className={styles.countBadgeText}>
                +{count}
            </span>
        </div>
    )
}

export default CountBadge