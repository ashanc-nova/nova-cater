import React from 'react';
import styles from './UserAvatar.module.scss';
import User from '../../../../assets/Icons/User';
interface UserAvatarProps {
    userInitials: string;
    onClick: () => void;
}

const UserAvatar = ({ userInitials, onClick }: UserAvatarProps) => {
    return (
        <button type="button" aria-label="User" className={styles.userAvatar} onClick={onClick}>
            <div className={styles.userAvatarIcon}>
                {userInitials ? (
                    <span className={styles.userAvatarIconText}>
                        {userInitials}
                    </span>
                ) : (
                    <span className={styles.profileIcon}>
                        <User />
                    </span>

                )}

            </div>
        </button>
    )
}

export default UserAvatar