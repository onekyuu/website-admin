import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

interface AuthResponse {
  access: string;
  refresh: string;
}

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
    throw new Error("登录失败");
  }

  const data = await res.json();

  // set token
  Cookies.set("access_token", data.access);
  Cookies.set("refresh_token", data.refresh);

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
    throw new Error(error.detail || "注册失败");
  }
}
