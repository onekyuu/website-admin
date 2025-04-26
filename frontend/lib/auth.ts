import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { AuthUserState, useAuthStore } from "./stores/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface AuthResponse {
  access: string;
  refresh: string;
}

export const setAuthUser = (access_token: string, refresh_token: string) => {
  // Setting access and refresh tokens in cookies with expiration dates
  Cookies.set("access_token", access_token, {
    expires: 7, // Access token expires in 1 day
    secure: true,
  });

  Cookies.set("refresh_token", refresh_token, {
    expires: 7, // Refresh token expires in 7 days
    secure: true,
  });

  // Decoding access token to get user information
  const user: AuthUserState = jwtDecode(access_token) ?? null;

  // If user information is present, update user state; otherwise, set loading state to false
  if (user) {
    useAuthStore.getState().setUser(user);
  }
  useAuthStore.getState().setLoading(false);
};

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/user/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("login failed");
  }

  const data = await res.json();

  // set token
  setAuthUser(data.access, data.refresh);

  return data;
}

export async function register(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/user/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "register failed");
  }
}

export const logout = () => {
  // Removing access and refresh tokens from cookies, resetting user state, and displaying success toast
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  useAuthStore.getState().setUser(null);
};
