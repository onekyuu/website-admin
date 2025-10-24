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

  // 204 No Content 或无内容时不调用 res.json()
  if (res.status === 204) {
    return null as T;
  }
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return null as T;
  }

  return res.json();
}
/**
 * 将对象转换为 URL 查询字符串
 * @example { page: 1, name: 'test' } => 'page=1&name=test'
 */
function buildQueryString(params?: Record<string, string | number>): string {
  if (!params) return "";
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  }
  return query.toString();
}

/**
 * 封装 GET 请求
 * @param endpoint API 路径（不需要包含 base URL）
 * @param params 查询参数对象（会自动转成 URL 查询字符串）
 * @param options 额外的 fetch 配置
 */
export async function get<T>(
  endpoint: string,
  params?: Record<string, string | number>,
  options?: RequestInit,
): Promise<T> {
  // 处理查询参数
  const queryString = buildQueryString(params);
  const finalEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;

  return fetcher<T>(finalEndpoint, {
    ...options,
    method: "GET",
  });
}

/**
 * 封装 POST 请求
 * @param endpoint API 路径（不需要包含 base URL）
 * @param data 请求体数据（会自动序列化成 JSON）
 * @param options 额外的 fetch 配置
 */
export async function post<T, D>(
  endpoint: string,
  data?: D,
  options?: RequestInit,
): Promise<T> {
  return fetcher<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * 封装 PATCH 请求
 * @param endpoint API 路径（不需要包含 base URL）
 * @param data 请求体数据（会自动序列化成 JSON）
 * @param options 额外的 fetch 配置
 */
export async function patch<T, D>(
  endpoint: string,
  data?: D,
  options?: RequestInit,
): Promise<T> {
  return fetcher<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * 封装 DELETE 请求
 * @param endpoint API 路径（不需要包含 base URL）
 * @param options 额外的 fetch 配置
 */
export async function del<T, D = unknown>(
  endpoint: string,
  data?: D,
  options?: RequestInit,
): Promise<T> {
  return fetcher<T>(endpoint, {
    ...options,
    method: "DELETE",
    body: data ? JSON.stringify(data) : undefined,
  });
}
