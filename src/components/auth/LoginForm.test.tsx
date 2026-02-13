import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuthStore, UserRole } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import "@testing-library/jest-dom";

jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn(),
    })),
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("LoginForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login form with email and password fields", () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows error for empty email", async () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it("shows error for invalid email format", async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it("shows error for short password", async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    
    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "123" } });
    
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it("toggles password visibility", async () => {
    render(<LoginForm />);
    
    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");
    
    const toggleButton = screen.getByRole("button", { name: /show password/i });
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(passwordInput.type).toBe("text");
    });
  });

  it("clears errors when user starts typing", async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test" } });
    
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });
});

describe("Auth Store", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isLoading: false });
  });

  it("has initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("sets user", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT" as UserRole,
      fullName: "Test User",
    };
    
    useAuthStore.getState().setUser(mockUser);
    
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it("sets loading state", () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it("clears user on logout", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT" as UserRole,
      fullName: "Test User",
    };
    
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().logout();
    
    expect(useAuthStore.getState().user).toBeNull();
  });
});
