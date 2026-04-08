import React from 'react'
import styles from './SummaryContainer.module.scss'
import SimpleDivider from '../../ui/SimpleDivider/SimpleDivider';

export interface SummaryItem {
    icon: React.ReactNode | string;
    title: string;
    value?: string;
    valueClassName?: string;
}

interface SummaryContainerProps {
    items: SummaryItem[];
}

const SummaryContainer = ({ items }: SummaryContainerProps) => {
    return (
        <div className={`w-full flex flex-col gap-3 md:gap-5 p-3 md:p-4 rounded-2xl ${styles.summaryContainer}`}>
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <div className="flex flex-row self-stretch gap-2 items-center">
                        <div className="w-9 h-9 flex justify-center items-center rounded-full bg-[var(--color-background-icon-container-legacy)]">
                            {item.icon}
                        </div>
                        <div className="text-sm font-normal leading-[21px] tracking-[-0.05px] text-[var(--type-secondary)]">
                            {item.title}
                        </div>
                        <div className={`${item.valueClassName || ''} text-sm font-medium leading-[21px] tracking-[-0.05px] text-[var(--type-primary)] ml-auto`}>
                            {item.value}
                        </div>
                    </div>
                    {index < items.length - 1 && <SimpleDivider />}
                </React.Fragment>
            ))}
        </div>
    )
}

export default SummaryContainer