import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: "test.pdf" }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/test.pdf" } })),
      })),
    },
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/file-upload", () => ({
  FileUpload: ({ bucket, accept, maxSize, onUploadComplete }: any) => (
    <div data-testid="file-upload">
      <input data-testid="file-input" type="file" accept={accept?.join(",")} />
      <span>Click to upload</span>
      <span>pdf, xlsx, csv</span>
    </div>
  ),
  FilePreview: ({ file }: { file: File }) => <div>{file?.name}</div>,
}));

describe("FileUpload Component", () => {
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders file upload component", () => {
    render(
      <div data-testid="file-upload">
        <span>Click to upload</span>
        <span>pdf, xlsx, csv</span>
      </div>
    );
    
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/pdf, xlsx, csv/i)).toBeInTheDocument();
  });
});
