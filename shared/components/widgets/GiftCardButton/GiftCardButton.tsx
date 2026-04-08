import React from 'react';
import styles from './GiftCardButton.module.scss';
import GiftCardIcon from '../../../../assets/Icons/GiftCardIcon';

const GiftCardButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <button type="button" aria-label="gift-card" className={styles.giftCardButton} onClick={onClick}>
            <div className={styles.giftCardIcon}>
                <span className={styles.giftCardIconContent}>
                    <GiftCardIcon />
                </span>

            </div>
        </button>
    )
}

export default GiftCardButton