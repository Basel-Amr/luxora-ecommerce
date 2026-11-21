(() => {
  "use strict";
  const form = document.querySelector("#register-form");
  if (!form) return;
  const button = form.querySelector(".auth-button");
  const strength = form.querySelector(".strength");
  const showToast = (message, type = "error") => window.showToast?.(message, type);
  const setError = (field, message = "") => {
    const error = form.querySelector(`[data-error-for="${field}"]`);
    if (error) error.textContent = message;
  };
  const setLoading = (loading) => {
    button.disabled = loading;
    button.classList.toggle("is-loading", loading);
  };
  const passwordScore = (password) =>
    [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
  const updateStrength = () => {
    const score = passwordScore(form.password.value);
    const labels = ["", "Very weak", "Weak", "Fair", "Good", "Strong"];
    strength.className = `strength ${score < 3 ? "weak" : score < 5 ? "medium" : "strong"}`;
    strength.querySelector(".strength-label").textContent = form.password.value
      ? labels[score]
      : "Use 8+ characters with upper, lower, number, and symbol.";
  };
  form.password.addEventListener("input", updateStrength);
  form.querySelectorAll(".toggle-password").forEach((toggle) =>
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.target);
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      toggle.textContent = visible ? "Show" : "Hide";
      toggle.setAttribute(
        "aria-label",
        `${visible ? "Show" : "Hide"} password`,
      );
    }),
  );
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    [
      "firstName",
      "lastName",
      "email",
      "password",
      "confirmPassword",
      "terms",
    ].forEach((field) => setError(field));
    const data = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value,
      password: form.password.value,
      confirmPassword: form.confirmPassword.value,
    };
    let valid = true;
    if (!auth.isValidName(data.firstName)) {
      setError("firstName", "Enter a valid first name.");
      valid = false;
    }
    if (!auth.isValidName(data.lastName)) {
      setError("lastName", "Enter a valid last name.");
      valid = false;
    }
    if (!auth.isValidEmail(data.email)) {
      setError("email", "Enter a valid email address.");
      valid = false;
    }
    if (!auth.isValidPassword(data.password)) {
      setError(
        "password",
        "Use 8+ characters with uppercase, lowercase, number, and symbol.",
      );
      valid = false;
    }
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", "Passwords do not match.");
      valid = false;
    }
    if (!form.terms.checked) {
      setError("terms", "Accept the terms and conditions to continue.");
      valid = false;
    }
    if (!valid) return;
    setLoading(true);
    try {
      await auth.registerUser(data);
      showToast(
        "Account created successfully. Redirecting to sign in…",
        "success",
      );
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch (error) {
      showToast(
        error.message || "Unable to create your account. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  });
})();
