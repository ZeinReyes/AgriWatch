import { useState } from "react";


const PasswordInput = ({
  name,
  value,
  onChange,
  placeholder = "Enter your password",
}) => {

  const [showPassword, setShowPassword] =
    useState(false);


  return (
    <div className="auth-input-group">

      <label htmlFor={name}>
        Password
      </label>

      <div className="password-wrapper">

        <input
          id={name}
          name={name}
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
        >
          {showPassword
            ? "Hide"
            : "Show"}
        </button>

      </div>

    </div>
  );
};


export default PasswordInput;