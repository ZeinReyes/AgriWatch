const getPasswordStrength = (
  password
) => {
  if (!password) {
    return {
      label: "",
      score: 0,
    };
  }

  let score = 0;

  if (password.length >= 8)
    score++;

  if (/[A-Z]/.test(password))
    score++;

  if (/[a-z]/.test(password))
    score++;

  if (/[0-9]/.test(password))
    score++;

  if (/[^A-Za-z0-9]/.test(password))
    score++;

  let label = "Weak";

  if (score >= 4) {
    label = "Strong";
  } else if (score >= 3) {
    label = "Medium";
  }

  return {
    label,
    score,
  };
};

const PasswordStrength = ({
  password,
}) => {
  const {
    label,
    score,
  } = getPasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className="password-strength">
      <div className="password-strength-header">
        <span>
          Password strength
        </span>

        <strong
          className={`strength-label strength-${label.toLowerCase()}`}
        >
          {label}
        </strong>
      </div>

      <div className="strength-bar">
        {[1, 2, 3, 4, 5].map(
          (level) => (
            <span
              key={level}
              className={
                level <= score
                  ? "strength-active"
                  : ""
              }
            />
          )
        )}
      </div>

      <p className="password-hint">
        Use at least 8 characters with uppercase,
        lowercase, numbers, and symbols.
      </p>
    </div>
  );
};

export default PasswordStrength;