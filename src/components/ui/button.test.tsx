import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import "@testing-library/jest-dom";

describe("Button Component", () => {
  it("renders button with default variant", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Click me");
  });

  it("renders button with gold variant", () => {
    render(<Button variant="gold">Gold Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-gold-500");
  });

  it("renders button with loading state", () => {
    render(<Button loading>Loading...</Button>);
    const spinner = screen.getByText(/loading/i);
    expect(spinner).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders button with different sizes", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("h-9");
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders as child component when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/test");
  });
});

describe("Input Component", () => {
  it("renders input element", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<Input error />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
  });

  it("handles value changes", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test value" } });
    expect(input).toHaveValue("test value");
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("handles disabled state", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

describe("Badge Component", () => {
  it("renders badge with default variant", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("renders badge with gold variant", () => {
    render(<Badge variant="gold">Gold</Badge>);
    const badge = screen.getByText("Gold");
    expect(badge).toHaveClass("bg-gold-500");
  });

  it("renders badge with destructive variant", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge).toHaveClass("bg-destructive");
  });
});

describe("Card Component", () => {
  it("renders card element", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Card Content</CardContent>
      </Card>
    );
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("applies glass card class", () => {
    render(<Card className="glass-card">Content</Card>);
    expect(screen.getByText("Content")).toHaveClass("glass-card");
  });
});
