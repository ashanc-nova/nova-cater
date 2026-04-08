import { LeftIconButton } from '../../../../assets/LeftIconButton';

const NavigateBackButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-lg transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      aria-label="Go back"
    >
      <LeftIconButton />
    </button>
  );
};

export default NavigateBackButton;
