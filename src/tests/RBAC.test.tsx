import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "@/stores/auth-store";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
  }),
}));

describe("Auth Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it("should initialize with default values", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.initialized).toBe(true);
  });

  it("should set user correctly", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT" as const,
      fullName: "Test User",
    };

    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.initialized).toBe(true);
  });

  it("should logout correctly", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT" as const,
      fullName: "Test User",
    };

    act(() => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.initialized).toBe(true);
  });
});

describe("Auth Store Role Checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it("should correctly identify ADMIN role", () => {
    act(() => {
      useAuthStore.getState().setUser({
        id: "123",
        email: "admin@example.com",
        role: "ADMIN" as const,
        fullName: "Test Admin",
      });
    });

    const state = useAuthStore.getState();
    expect(state.user?.role).toBe("ADMIN");
  });

  it("should correctly identify FACULTY role", () => {
    act(() => {
      useAuthStore.getState().setUser({
        id: "123",
        email: "faculty@example.com",
        role: "FACULTY" as const,
        fullName: "Test Faculty",
      });
    });

    const state = useAuthStore.getState();
    expect(state.user?.role).toBe("FACULTY");
  });

  it("should correctly identify STUDENT role", () => {
    act(() => {
      useAuthStore.getState().setUser({
        id: "123",
        email: "student@example.com",
        role: "STUDENT" as const,
        fullName: "Test Student",
      });
    });

    const state = useAuthStore.getState();
    expect(state.user?.role).toBe("STUDENT");
  });
});
