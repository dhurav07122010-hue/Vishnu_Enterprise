// Simple localStorage-based admin authentication
// Admin credentials: username "admin", password "dhurav@12"

const ADMIN_TOKEN_KEY = "vc_admin_auth_v1";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "dhurav@12";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_KEY) === "authenticated";
  } catch {
    return false;
  }
}

export function adminLogin(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    try {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, "authenticated");
    } catch {
      // ignore storage errors
    }
    return true;
  }
  return false;
}

export function adminLogout(): void {
  try {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}
