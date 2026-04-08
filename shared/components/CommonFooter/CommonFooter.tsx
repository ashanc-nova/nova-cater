import React from 'react'

interface CommonFooterProps {
    onCancel?: () => void
    onConfirm?: () => void
    isConfirmDisabled?: boolean
    /** When set, replaces the default confirm label (e.g. loading state with spinner) */
    confirmButtonContent?: React.ReactNode
    styles?: {
        footerContainer?: string
        footerContainerStyle?: React.CSSProperties
        cancelButton?: string
        confirmButton?: string
        cancelButtonText?: string
        confirmButtonText?: string
    }
}

const CommonFooter = ({
    onCancel = () => {},
    onConfirm = () => {},
    isConfirmDisabled = false,
    confirmButtonContent,
    styles: footerStyles,
}: CommonFooterProps) => {
  return (
    <div className={footerStyles?.footerContainer} style={footerStyles?.footerContainerStyle}>
        {onCancel && <button onClick={onCancel} className={footerStyles?.cancelButton}>
            <span>
                {/* <Lottie animationData={buttonLoaderWhite} loop={true} /> */}
            </span>
            <span>{footerStyles?.cancelButtonText}</span>
        </button>}
        {onConfirm && <button 
            onClick={onConfirm} 
            className={footerStyles?.confirmButton}
            disabled={isConfirmDisabled}
        >
            {confirmButtonContent ?? (
              <>
                <span>
                    {/* <Lottie animationData={buttonLoaderWhite} loop={true} /> */}
                </span>
                <span>{footerStyles?.confirmButtonText}</span>
              </>
            )}
        </button>}

    </div>
  );
};
export default CommonFooter;