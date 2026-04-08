// src/shared/components/Checkbox/Checkbox.tsx
import styles from './Checkbox.module.scss';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  price?: number;
  disabled?: boolean;
  size?: number;
}

const Checkbox = ({ id, checked, onChange, label, price, disabled = false, size = 18 }: CheckboxProps) => {
  return (
    <label className={`${styles.checkboxLabel} ${disabled ? styles.disabled : ''}`} htmlFor={id}>
      <div className={styles.checkboxLeft}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={styles.checkboxInput}
          style={{ width: size, height: size }}
        />
        <span className={styles.checkboxCustom}>
          <svg
            className={styles.checkIcon}
            viewBox="0 0 12 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.checkboxText}>{label}</span>
      </div>
      {price !== undefined && price > 0 && (
        <span className={styles.checkboxPrice}>${price.toFixed(2)}</span>
      )}
    </label>
  );
};

export default Checkbox;
