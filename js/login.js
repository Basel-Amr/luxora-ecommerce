(() => {
  "use strict";
  const form = document.querySelector("#login-form");
  if (!form) return;
  const button = form.querySelector(".auth-button");

  const showToast = (message, type = "error") => window.showToast?.(message, type);
  const setError = (field, message = "") => {
    const error = form.querySelector(`[data-error-for="${field}"]`);
    if (error) error.textContent = message;
  };
  const setLoading = (loading) => {
    button.disabled = loading;
    button.classList.toggle("is-loading", loading);
  };

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
  document
    .querySelector("#forgot-password")
    .addEventListener("click", (event) => {
      event.preventDefault();
      showToast("Password recovery will be available in a future update.");
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled) return;
    ["email", "password"].forEach((field) => setError(field));
    const email = form.email.value;
    const password = form.password.value;
    let valid = true;
    if (!auth.isValidEmail(email)) {
      setError("email", "Enter a valid email address.");
      valid = false;
    }
    if (!password) {
      setError("password", "Enter your password.");
      valid = false;
    }
    if (!valid) return;
    setLoading(true);
    try {
      await auth.loginUser(email, password);
      showToast("Signed in successfully. Redirecting…", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 650);
    } catch (error) {
      showToast(error.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  });
})();
