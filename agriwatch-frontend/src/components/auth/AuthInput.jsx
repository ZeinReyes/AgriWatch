const AuthInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required = true,
  autoComplete = "off",
}) => {
  return (
    <div className="auth-input-group">
      <label htmlFor={name}>
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
      />
    </div>
  );
};

export default AuthInput;