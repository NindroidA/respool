import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSession = vi.fn();

vi.mock("./auth", () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { requireUser, requireAdmin } from "./auth-helpers";

describe("requireUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when session exists", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", name: "Test", email: "test@test.com" },
    });

    const user = await requireUser();
    expect(user.id).toBe("user-1");
    expect(user.name).toBe("Test");
  });

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("Unauthorized");
  });

  it("throws when session has no user", async () => {
    mockGetSession.mockResolvedValue({ user: null });
    await expect(requireUser()).rejects.toThrow("Unauthorized");
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when admin", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "admin-1", name: "Admin", email: "admin@test.com", role: "admin" },
    });

    const user = await requireAdmin();
    expect(user.id).toBe("admin-1");
  });

  it("throws when user is not admin", async () => {
    mockGetSession.mockResolvedValue({
      user: { id: "user-1", name: "User", email: "user@test.com", role: "user" },
    });

    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("throws when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });
});
