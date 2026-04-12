import { describe, it, expect, vi } from "vitest";

// Mock prisma before importing audit
vi.mock("./prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "test-id" }),
    },
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(
    new Map([
      ["x-forwarded-for", "127.0.0.1"],
      ["user-agent", "test-agent"],
    ]),
  ),
}));

import { audit } from "./audit";
import { prisma } from "./prisma";

describe("audit", () => {
  it("creates an audit log entry with required fields", async () => {
    await audit({
      userId: "user-1",
      userEmail: "test@example.com",
      userName: "Test User",
      action: "spool.create",
      category: "spool",
    });

    // Give fire-and-forget time to complete
    // Flush microtask queue so the fire-and-forget promise resolves
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          userEmail: "test@example.com",
          userName: "Test User",
          action: "spool.create",
          category: "spool",
          severity: "info",
        }),
      }),
    );
  });

  it("defaults severity to info when not specified", async () => {
    await audit({
      action: "box.create",
      category: "box",
    });

    // Flush microtask queue so the fire-and-forget promise resolves
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: "info",
        }),
      }),
    );
  });

  it("passes severity when specified", async () => {
    await audit({
      action: "admin.user_banned",
      category: "admin",
      severity: "critical",
    });

    // Flush microtask queue so the fire-and-forget promise resolves
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          severity: "critical",
        }),
      }),
    );
  });

  it("includes target information", async () => {
    await audit({
      action: "spool.delete",
      category: "spool",
      severity: "warning",
      targetType: "Spool",
      targetId: "spool-123",
      targetName: "White PLA",
    });

    // Flush microtask queue so the fire-and-forget promise resolves
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetType: "Spool",
          targetId: "spool-123",
          targetName: "White PLA",
        }),
      }),
    );
  });

  it("handles null optional fields", async () => {
    await audit({
      action: "system.deploy",
      category: "system",
    });

    // Flush microtask queue so the fire-and-forget promise resolves
    await new Promise((r) => queueMicrotask(() => r(undefined)));

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: null,
          userEmail: null,
          userName: null,
          targetType: null,
          targetId: null,
          targetName: null,
        }),
      }),
    );
  });
});
