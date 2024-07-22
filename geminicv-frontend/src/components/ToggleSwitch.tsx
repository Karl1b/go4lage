// ToggleSwitch.tsx
interface ToggleSwitchProps {
  isChecked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ isChecked, onChange }: ToggleSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer mx-2">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div
        className="w-12 h-7 bg-gray-200 peer-color-pink
        rounded-full peer peer-focus:ring-2 peer-focus:ring-pink dark:peer-focus:ring-pink peer-checked:after:translate-x-full  after:content-['']
        after:absolute after:top-[2px] after:left-[2px] after:border-gray-300  after:rounded-full after:h-6 after:w-6 after:transition-all after:bg-pink after:ring-5 after:ring-pink"
      ></div>
    </label>
  );
}

export default ToggleSwitch;
