import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminStats, useStudentAssignments, useFacultyClasses } from "@/hooks/use-dashboard";

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
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.initialized).toBe(false);
  });

  it("should set user correctly", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT",
      fullName: "Test User",
    };

    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.initialized).toBe(true);
  });

  it("should logout correctly", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT",
      fullName: "Test User",
    };

    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setUser(mockUser);
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.initialized).toBe(true);
  });
});

describe("usePermission Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return false when user has no permissions", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT",
      fullName: "Test User",
    };

    const { result } = renderHook(() => usePermission("users:read"));
    
    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    expect(result.current).toBe(false);
  });

  it("should return true when user has required permission", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "ADMIN",
      fullName: "Test Admin",
      permissions: ["users:read", "users:write"],
    };

    const { result } = renderHook(() => usePermission("users:read"));
    
    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    expect(result.current).toBe(true);
  });
});

describe("useRole Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return false when user role does not match", () => {
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT",
      fullName: "Test User",
    };

    const { result } = renderHook(() => useRole(["ADMIN", "FACULTY"]));
    
    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    expect(result.current).toBe(false);
  });

  it("should return true when user role matches", () => {
    const mockUser = {
      id: "123",
      email: "admin@example.com",
      role: "ADMIN",
      fullName: "Test Admin",
    };

    const { result } = renderHook(() => useRole(["ADMIN", "SUPER_ADMIN"]));
    
    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    expect(result.current).toBe(true);
  });
});

describe("Dashboard Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("useAdminStats should fetch and return stats", async () => {
    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          count: 100,
        }),
      }),
    };

    vi.spyOn(require("@/lib/supabase/client"), "createClient").mockReturnValue(mockSupabaseClient);

    const { result, waitForNextUpdate } = renderHook(() => useAdminStats());
    
    await waitForNextUpdate();
    
    expect(result.current.stats).not.toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("useStudentAssignments should return assignments", async () => {
    const mockAssignments = [
      {
        id: "1",
        title: "Test Assignment",
        due_date: new Date().toISOString(),
        subject_name: "Test Subject",
        submitted: false,
      },
    ];

    const mockSupabaseClient = {
      from: vi.fn((table) => {
        if (table === "students") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "123" } }),
              }),
            }),
          };
        }
        if (table === "assignments") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockAssignments }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      }),
    };

    vi.spyOn(require("@/lib/supabase/client"), "createClient").mockReturnValue(mockSupabaseClient);

    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "STUDENT",
      fullName: "Test User",
    };

    const { result, waitForNextUpdate } = renderHook(() => useStudentAssignments());
    
    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    await waitForNextUpdate();
    
    expect(result.current.assignments).toEqual(mockAssignments);
    expect(result.current.loading).toBe(false);
  });
});

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect to login when not authenticated", () => {
    const mockRouter = {
      push: vi.fn(),
    };

    vi.spyOn(require("next/navigation"), "useRouter").mockReturnValue(mockRouter);

    render(
      <ProtectedRoute requiredRole={["ADMIN"]}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining("/login"));
  });

  it("should render children when authenticated with correct role", () => {
    const mockUser = {
      id: "123",
      email: "admin@example.com",
      role: "ADMIN",
      fullName: "Test Admin",
      permissions: [],
    };

    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    const { getByText } = render(
      <ProtectedRoute requiredRole={["ADMIN"]}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(getByText("Protected Content")).toBeInTheDocument();
  });
});

describe("FileUpload Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should accept valid file types", async () => {
    const mockOnUploadComplete = vi.fn();
    const user = userEvent.setup();

    render(
      <FileUpload
        bucket="test"
        accept={["pdf", "xlsx", "csv"]}
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const input = screen.getByLabelText(/click to upload/i);
    
    const validFile = new File(["test"], "test.pdf", { type: "application/pdf" });
    await user.upload(input, validFile);

    expect(screen.getByText("test.pdf")).toBeInTheDocument();
  });

  it("should reject invalid file types", async () => {
    const user = userEvent.setup();
    const mockToast = vi.fn();
    vi.spyOn(require("@/hooks/use-toast"), "toast").mockImplementation(mockToast);

    render(
      <FileUpload bucket="test" accept={["pdf", "xlsx"]} />
    );

    const input = screen.getByLabelText(/click to upload/i);
    
    const invalidFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
    await user.upload(input, invalidFile);

    expect(screen.queryByText("test.jpg")).not.toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "destructive",
      })
    );
  });

  it("should show upload progress", async () => {
    render(
      <FileUpload bucket="test" />
    );

    expect(screen.getByText(/upload file/i)).toBeInTheDocument();
  });
});

describe("Assignment List Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    render(<AssignmentList />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("should show empty state when no assignments", async () => {
    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "123" } }),
          }),
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    };

    vi.spyOn(require("@/lib/supabase/client"), "createClient").mockReturnValue(mockSupabaseClient);

    const mockUser = {
      id: "123",
      email: "faculty@example.com",
      role: "FACULTY",
      fullName: "Test Faculty",
    };

    act(() => {
      useAuthStore.getState().setUser(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByText(/no assignments/i)).toBeInTheDocument();
    });
  });
});

describe("Notice Management Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display notices", async () => {
    const mockNotices = [
      {
        id: "1",
        title: "Test Notice",
        content: "Test content",
        priority: "normal",
        category: "general",
        published_at: new Date().toISOString(),
        published_by_name: "Admin",
      },
    ];

    render(<NoticeManagement />);

    await waitFor(() => {
      expect(screen.getByText("Test Notice")).toBeInTheDocument();
    });
  });

  it("should show priority badges", async () => {
    const mockNotices = [
      {
        id: "1",
        title: "Urgent Notice",
        content: "Test content",
        priority: "high",
        category: "exam",
        published_at: new Date().toISOString(),
        published_by_name: "Admin",
      },
    ];

    render(<NoticeManagement />);

    await waitFor(() => {
      expect(screen.getByText(/high priority/i)).toBeInTheDocument();
    });
  });
});

describe("Complaint List Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display complaints with status badges", async () => {
    const mockComplaints = [
      {
        id: "1",
        title: "Test Complaint",
        description: "Test description",
        category: "academic",
        status: "PENDING",
        priority: "high",
        created_at: new Date().toISOString(),
      },
    ];

    render(<ComplaintList />);

    await waitFor(() => {
      expect(screen.getByText("Test Complaint")).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });
});

describe("Fee Tracking Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should display fee summary cards", async () => {
    const mockPayments = [
      {
        id: "1",
        amount: 50000,
        status: "PENDING",
        due_date: new Date().toISOString(),
        fee_structure: { name: "Tuition Fee", category: "tuition" },
      },
    ];

    render(<FeeTracking />);

    await waitFor(() => {
      expect(screen.getByText(/₹50,000/i)).toBeInTheDocument();
    });
  });

  it("should show overdue badges for late payments", async () => {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 5);

    const mockPayments = [
      {
        id: "1",
        amount: 50000,
        status: "PENDING",
        due_date: overdueDate.toISOString(),
        fee_structure: { name: "Tuition Fee", category: "tuition" },
      },
    ];

    render(<FeeTracking />);

    await waitFor(() => {
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });
  });
});

describe("Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should redirect unauthenticated users to login", () => {
    const mockRedirect = vi.fn();
    vi.spyOn(require("next/navigation"), "redirect").mockImplementation(mockRedirect);

    const middleware = createMiddleware({
      pathname: "/admin/dashboard",
      cookies: {},
      headers: {},
    });

    middleware({
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
    } as any);

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("should redirect users with wrong role to their dashboard", () => {
    const mockRedirect = vi.fn();
    vi.spyOn(require("next/navigation"), "redirect").mockImplementation(mockRedirect);

    const middleware = createMiddleware({
      pathname: "/admin/dashboard",
      cookies: {},
      headers: {},
    });

    middleware({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: { user: { id: "123" } },
          },
        }),
      },
      db: {
        users: {
          findUnique: vi.fn().mockResolvedValue({ role: "STUDENT" }),
        },
      },
    } as any);

    expect(mockRedirect).toHaveBeenCalledWith("/student/dashboard");
  });

  it("should allow access for correct role", () => {
    const mockNext = vi.fn();
    vi.spyOn(require("next/server"), "NextResponse").mockReturnValue({
      next: mockNext,
    });

    const middleware = createMiddleware({
      pathname: "/admin/dashboard",
      cookies: {},
      headers: {},
    });

    middleware({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: { user: { id: "123" } },
          },
        }),
      },
      db: {
        users: {
          findUnique: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        },
      },
    } as any);

    expect(mockNext).toHaveBeenCalled();
  });
});
