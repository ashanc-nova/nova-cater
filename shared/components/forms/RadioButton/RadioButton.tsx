// src/shared/components/Radio/Radio.tsx
import styles from './RadioButton.module.scss';

interface RadioButtonProps {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  price?: number;
  disabled?: boolean;
}

const RadioButton = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  price,
  disabled = false,
}: RadioButtonProps) => {
  return (
    <label className={`${styles.radioLabel} ${disabled ? styles.disabled : ''}`} htmlFor={id}>
      <div className={styles.radioLeft}>
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={() => onChange(value)}
          disabled={disabled}
          className={styles.radioInput}
        />
        <span className={styles.radioCustom} />
        <span className={`${styles.radioText} ${disabled ? styles.unavailable : ''}`}>{label}</span>
      </div>
      {price !== undefined && price > 0 && (
        <span className={`${styles.radioPrice} ${disabled ? styles.unavailable : ''}`}>${price.toFixed(2)}</span>
      )}
    </label>
  );
};

export default RadioButton;
