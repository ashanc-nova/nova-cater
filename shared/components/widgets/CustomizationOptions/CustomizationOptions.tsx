// src/components/organisms/CustomizationOptions/CustomizationOptions.tsx
import { Fragment } from 'react';
import type { CustomizationOption } from '../../../../features/menu/types/menu';
import styles from '../../../styles/components/CustomizationOptions.module.scss';

interface CustomizationOptionsProps {
  options: CustomizationOption[];
  customizationId: string;
  type: 'single' | 'multiple';
  selectedOptions: string[];
  onOptionChange: (optionId: string) => void;
}

const CustomizationOptions = ({
  options,
  customizationId,
  type,
  selectedOptions,
  onOptionChange,
}: CustomizationOptionsProps) => {
  return (
    <div className={styles.container}>
      {options.map((option, index) => (
        <Fragment key={option.id}>
          <label className={styles.optionLabel}>
            <div className={styles.optionLeft}>
              <input
                type={type === 'single' ? 'radio' : 'checkbox'}
                name={customizationId}
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={() => onOptionChange(option.id)}
                className={styles.optionInput}
              />
              <span className={styles.optionName}>{option.name}</span>
            </div>
            <span className={`${styles.optionPrice} ${option.isOutOfStock ? styles.disabled : ''}`}>
              +${option.price}
            </span>
          </label>

          {/* Add divider between options, but not after the last one */}
          {index < options.length - 1 && <div className={styles.divider} />}
        </Fragment>
      ))}
    </div>
  );
};

export default CustomizationOptions;
