export default function InputField({
  label,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  rightEl,
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#3d5028]">
        {label}
      </label>

      <div className="flex items-center gap-3 bg-[#f5f3ec] border border-[#d6cebc] rounded-xl px-4 py-3">
        {Icon && <Icon size={16} className="text-[#8aab5c]" />}

        <input
          type={type}
          placeholder={placeholder}
          {...props}
          className="bg-transparent outline-none text-sm w-full text-[#2d3a1e] placeholder-[#b0aa9a]"
        />
        {rightEl}
      </div>

      {error && (
        <p className="text-red-500 text-xs ml-4">{error}</p>
      )}
    </div>
  );
}