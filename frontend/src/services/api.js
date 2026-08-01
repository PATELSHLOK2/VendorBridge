const TOKEN_KEY = "vb_token";

export const api = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async fetch(url, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get("Content-Type") || "";

      if (contentType.includes("application/pdf")) {
        if (!response.ok) {
          if (response.status === 401) {
            this.clearToken();
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
            throw new Error("Session expired or unauthorized. Please log in again.");
          }
          throw new Error("Failed to download PDF document");
        }
        return await response.blob();
      }

      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const rawText = await response.text();
        if (!response.ok) {
          if (response.status === 413) {
            throw new Error("Request payload is too large. Please select a smaller photo or file.");
          }
          if (response.status === 401) {
            this.clearToken();
            if (window.location.pathname !== "/login") {
              window.location.href = "/login";
            }
            throw new Error("Unauthorized: Session expired. Please log in again.");
          }
          throw new Error(`Server returned error (${response.status}): ${response.statusText}`);
        }
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { success: true, message: rawText };
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        throw new Error(data.error || "An unexpected error occurred");
      }

      return data;
    } catch (error) {
      showToast(error.message || "Network request failed", "error");
      throw error;
    }
  },

  get(url) {
    return this.fetch(url, { method: "GET" });
  },

  post(url, body) {
    return this.fetch(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put(url, body) {
    return this.fetch(url, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  delete(url) {
    return this.fetch(url, { method: "DELETE" });
  },
};

export function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === "success" ? "✓" : type === "error" ? "⚠️" : "ℹ"}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}
