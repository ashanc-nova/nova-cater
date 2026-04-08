import GenericTick from '../../../../assets/images/GenericTick';

const Required = () => {
  return (
    <div className="flex flex-row gap-1 h-[32px] w-[fit-content] items-center justify-center bg-[#25BA4C33] rounded-full border border-[#25BA4C33] pt-2 pl-3 pr-4 pb-2">
      <GenericTick />
      <span className="text-[12px] md:text-[14px] text-[#187A32] leading-[21px] tracking-[-0.05px] font-normal font-inter">
        Required
      </span>
    </div>
  );
};

export default Required;
