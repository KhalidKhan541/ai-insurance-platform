import { describe, it, expect } from "vitest";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

function renderButton(props: ButtonProps): string {
  const variant = props.variant || "primary";
  const size = props.size || "md";

  const variantClasses: Record<string, string> = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };

  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const classes = [
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
    variantClasses[variant],
    sizeClasses[size],
    props.disabled ? "opacity-50 cursor-not-allowed" : "",
    props.loading ? "opacity-75" : "",
    props.className || "",
  ]
    .filter(Boolean)
    .join(" ");

  const attrs = [
    `class="${classes}"`,
    props.disabled ? "disabled" : "",
    props.loading ? "aria-busy=true" : "",
    `type="${props.type || "button"}"`,
  ]
    .filter(Boolean)
    .join(" ");

  return `<button ${attrs}>${props.loading ? "Loading..." : props.children}</button>`;
}

describe("Button Component", () => {
  it("should render with default props", () => {
    const html = renderButton({ children: "Click me" });
    expect(html).toContain("Click me");
    expect(html).toContain("bg-brand-600");
    expect(html).toContain("px-4 py-2");
  });

  it("should render primary variant", () => {
    const html = renderButton({ children: "Primary", variant: "primary" });
    expect(html).toContain("bg-brand-600");
    expect(html).toContain("text-white");
  });

  it("should render secondary variant", () => {
    const html = renderButton({ children: "Secondary", variant: "secondary" });
    expect(html).toContain("bg-gray-100");
    expect(html).toContain("text-gray-900");
  });

  it("should render danger variant", () => {
    const html = renderButton({ children: "Delete", variant: "danger" });
    expect(html).toContain("bg-red-600");
  });

  it("should render ghost variant", () => {
    const html = renderButton({ children: "Ghost", variant: "ghost" });
    expect(html).toContain("bg-transparent");
  });

  it("should render small size", () => {
    const html = renderButton({ children: "Small", size: "sm" });
    expect(html).toContain("px-3 py-1.5 text-sm");
  });

  it("should render medium size", () => {
    const html = renderButton({ children: "Medium", size: "md" });
    expect(html).toContain("px-4 py-2 text-base");
  });

  it("should render large size", () => {
    const html = renderButton({ children: "Large", size: "lg" });
    expect(html).toContain("px-6 py-3 text-lg");
  });

  it("should render disabled state", () => {
    const html = renderButton({ children: "Disabled", disabled: true });
    expect(html).toContain("disabled");
    expect(html).toContain("opacity-50");
    expect(html).toContain("cursor-not-allowed");
  });

  it("should render loading state", () => {
    const html = renderButton({ children: "Submit", loading: true });
    expect(html).toContain("Loading...");
    expect(html).toContain("aria-busy=true");
    expect(html).toContain("opacity-75");
  });

  it("should use submit type when specified", () => {
    const html = renderButton({ children: "Submit", type: "submit" });
    expect(html).toContain('type="submit"');
  });

  it("should use button type by default", () => {
    const html = renderButton({ children: "Click" });
    expect(html).toContain('type="button"');
  });

  it("should apply custom class", () => {
    const html = renderButton({
      children: "Custom",
      className: "my-custom-class",
    });
    expect(html).toContain("my-custom-class");
  });

  it("should combine variant and size classes", () => {
    const html = renderButton({
      children: "Combined",
      variant: "danger",
      size: "lg",
    });
    expect(html).toContain("bg-red-600");
    expect(html).toContain("px-6 py-3");
  });
});
