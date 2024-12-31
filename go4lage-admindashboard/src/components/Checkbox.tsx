
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Checkbox({ label, checked, onChange }:CheckboxProps){
  return (
    <label className="flex items-center space-x-3 m-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="form-checkbox h-5 w-5 accent-brand"
      />
      <span className="text-text-primary">{label}</span>
    </label>
  );
}


