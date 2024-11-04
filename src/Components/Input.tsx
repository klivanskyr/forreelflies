export default function Input({ className="", label, placeholder, type = 'text', onChange, value, ...props }:{ className?: string, label?: string, placeholder?: string, type?: string, onChange?: any, value?: string, props?: any }) {
  return (
    <div className="w-full h-full">
      {label && <label className={""}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder || ""}
        onChange={onChange}
        value={value}
        className={`${className} w-full border h-[40px] px-8 py-2 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500`}
        {...props}
      />
    </div>
  );
};
