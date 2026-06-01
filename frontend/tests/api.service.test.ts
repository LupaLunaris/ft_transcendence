import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ApiError } from "@ft/shared";

// ── Helpers ────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ApiService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("auth.login: sends POST and returns unwrapped data", async () => {
    const payload = { user: { id: "u1", username: "alice" }, token: "jwt-abc" };
    global.fetch = mockFetch({ data: payload });

    // Import after mocking fetch so the module picks up the mock
    const { api } = await import("@/services/api.service");
    const result = await api.auth.login({ email: "a@b.com", password: "pass1234" });

    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("request: attaches Authorization header when token present in localStorage", async () => {
    localStorage.setItem("ft_token", "my-token");
    global.fetch = mockFetch({ data: { id: "u1" } });

    const { api } = await import("@/services/api.service");
    await api.auth.getMe();

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-token");
  });

  it("request: throws ApiError on 4xx response", async () => {
    const errorBody: ApiError = { error: "Unauthorized", code: 401 };
    global.fetch = mockFetch(errorBody, 401);

    const { api } = await import("@/services/api.service");

    await expect(api.auth.getMe()).rejects.toMatchObject({ error: "Unauthorized", code: 401 });
  });

  it("maps.delete: handles 204 No Content without crash", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(undefined) });

    const { api } = await import("@/services/api.service");
    const result = await api.maps.delete("map-123");

    expect(result).toBeUndefined();
  });

  it("maps.getPublished: returns PaginatedResponse directly (no extra unwrap)", async () => {
    const paginated = { data: [{ id: "m1", name: "Test" }], total: 1, page: 1, limit: 20 };
    global.fetch = mockFetch(paginated);

    const { api } = await import("@/services/api.service");
    const result = await api.maps.getPublished(1);

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });
});
