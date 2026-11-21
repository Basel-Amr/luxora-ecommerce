(() => {
  "use strict";

  const USERS_KEY = "users";
  const LOGGED_IN_KEY = "loggedIn";
  const LOGGED_IN_USER_KEY = "loggedInUser";
  const PBKDF2_ITERATIONS = 310000;
  const SALT_LENGTH = 16;
  const HASH_LENGTH = 256;

  const readUsers = () => {
    try {
      const storedUsers = localStorage.getItem(USERS_KEY);
      if (!storedUsers) return {};
      const users = JSON.parse(storedUsers);
      return users && typeof users === "object" && !Array.isArray(users)
        ? users
        : {};
    } catch (error) {
      console.error("Unable to read users from localStorage.", error);
      return {};
    }
  };

  const saveUsers = (users) =>
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const normalizeEmail = (email) =>
    String(email || "")
      .trim()
      .toLowerCase();
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email));
  const isValidName = (name) =>
    /^[\p{L}][\p{L}' -]{1,39}$/u.test(String(name || "").trim());
  const isValidPassword = (password) =>
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const bytesToBase64 = (bytes) => {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const base64ToBytes = (value) =>
    Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

  const assertCrypto = () => {
    if (
      !window.crypto ||
      !window.crypto.subtle ||
      !window.crypto.getRandomValues
    ) {
      throw new Error("Secure authentication is unavailable in this browser.");
    }
  };

  const hashPassword = async (password, salt = null) => {
    assertCrypto();
    const saltBytes =
      salt || crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const encodedPassword = new TextEncoder().encode(password);
    const key = await crypto.subtle.importKey(
      "raw",
      encodedPassword,
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      key,
      HASH_LENGTH,
    );
    return {
      salt: bytesToBase64(saltBytes),
      passwordHash: bytesToBase64(new Uint8Array(bits)),
    };
  };

  const verifyPassword = async (password, user) => {
    if (!user || !user.salt || !user.passwordHash) return false;
    const result = await hashPassword(password, base64ToBytes(user.salt));
    return result.passwordHash === user.passwordHash;
  };

  const registerUser = async ({ firstName, lastName, email, password }) => {
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();
    if (users[normalizedEmail])
      throw new Error("An account with this email already exists.");
    const { salt, passwordHash } = await hashPassword(password);
    users[normalizedEmail] = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
    return {
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    };
  };

  const loginUser = async (email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const users = readUsers();
    const user = users[normalizedEmail];
    if (!user) throw new Error("The email or password is incorrect.");

    let verified = false;
    if (user.passwordHash && user.salt) {
      verified = await verifyPassword(password, user);
    } else if (Object.prototype.hasOwnProperty.call(user, "password")) {
      verified = password === String(user.password);
      if (verified) {
        const migrated = await hashPassword(password);
        users[normalizedEmail] = { ...user, ...migrated };
        delete users[normalizedEmail].password;
        saveUsers(users);
      }
    }
    if (!verified) throw new Error("The email or password is incorrect.");

    const safeUser = {
      email: normalizedEmail,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    };
    localStorage.setItem(LOGGED_IN_KEY, "true");
    localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
  };

  const logout = () => {
    localStorage.setItem(LOGGED_IN_KEY, "false");
    localStorage.removeItem(LOGGED_IN_USER_KEY);
  };

  window.auth = {
    readUsers,
    saveUsers,
    normalizeEmail,
    isValidEmail,
    isValidName,
    isValidPassword,
    hashPassword,
    verifyPassword,
    registerUser,
    loginUser,
    logout,
  };
})();
