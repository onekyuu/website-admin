import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

function isAccessTokenExpired(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (err) {
    console.log(err);
    return true;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = Cookies.get("refresh_token");
  if (!refreshToken) return null;

  const res = await fetch(`${API_BASE_URL}/user/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  Cookies.set("access_token", data.access);
  return data.access;
}

export async function fetcher<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let accessToken = Cookies.get("access_token");

  // token expired, refresh it
  if (isAccessTokenExpired(accessToken)) {
    accessToken = (await refreshAccessToken()) || undefined;
  }

  const headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // ensure cookies are sent
  });

  if (!res.ok) {
    throw new Error(`Fetch error: ${res.status}`);
  }

  return res.json();
}
