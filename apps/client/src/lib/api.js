const BASE = "/api"; // the Vite dev-server proxy (vite.config.js) forwards this to apps/api in development

class ApiError extends Error {
  constructor(message, { code, status }) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include", // sends the httpOnly session cookie — this is the entire auth mechanism, no token handling here
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(data?.error?.message ?? res.statusText, {
      code: data?.error?.code ?? "UNKNOWN",
      status: res.status,
    });
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export { ApiError };
