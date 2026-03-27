async function apiFetch(path, options = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 45000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      credentials: "include",
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
      }
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("This is taking longer than usual. Hang tight, then try again.");
    }
    throw error;
  }

  clearTimeout(timeoutId);

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed");
    error.payload = payload;
    throw error;
  }

  return payload;
}

export { apiFetch };
