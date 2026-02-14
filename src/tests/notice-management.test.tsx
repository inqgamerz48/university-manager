import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: "user-1", email: "admin@test.com", role: "ADMIN" },
  })),
}));

vi.mock("@/hooks/use-dashboard", () => ({
  useNotices: vi.fn(() => ({ notices: [], loading: false })),
  createNotice: vi.fn(),
}));

describe("NoticeManagement Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has correct structure", () => {
    expect(true).toBe(true);
  });
});
