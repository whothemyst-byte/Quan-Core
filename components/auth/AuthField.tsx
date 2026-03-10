interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

export function AuthField({
  id,
  label,
  type = "text",
  autoComplete,
  placeholder,
  value,
  onChange,
}: AuthFieldProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="text-[13px] font-medium tracking-[0.02em] text-[#8a9ab5]">{label}</span>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-glass"
        required
      />
    </label>
  );
}
