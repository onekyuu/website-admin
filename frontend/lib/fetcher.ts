import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

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
  if (isRefreshing && refreshPromise) {
    return refreshPromise; // 正在刷新就复用上次
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = Cookies.get("refresh_token");
      if (!refreshToken) return null;

      const res = await fetch(`${API_BASE_URL}/user/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await res.json();

      if (!res.ok || data.code === "token_not_valid") {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        const locale = window.location.pathname.split("/")[1];
        const basePath = ["zh", "en", "ja"].includes(locale)
          ? `/${locale}`
          : "";
        window.location.href = `${basePath}/login`;
        return null;
      }

      Cookies.set("access_token", data.access);
      Cookies.set("refresh_token", data.refresh); // 如果后端提供新的 refresh token

      return data.access;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
