import { describe, it, expect } from "vitest";

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

function renderCard(props: CardProps): string {
  const variant = props.variant || "default";
  const padding = props.padding || "md";

  const variantClasses: Record<string, string> = {
    default: "bg-white border border-gray-200 shadow-card",
    outlined: "bg-white border-2 border-gray-300",
    elevated: "bg-white shadow-card-hover",
  };

  const paddingClasses: Record<string, string> = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const classes = [
    "rounded-xl",
    variantClasses[variant],
    paddingClasses[padding],
    props.className || "",
  ]
    .filter(Boolean)
    .join(" ");

  let content = "";
  if (props.title) {
    content += `<h3 class="text-lg font-semibold text-gray-900">${props.title}</h3>`;
  }
  if (props.description) {
    content += `<p class="mt-1 text-sm text-gray-500">${props.description}</p>`;
  }
  content += `<div class="mt-4">${props.children}</div>`;

  return `<div class="${classes}">${content}</div>`;
}

describe("Card Component", () => {
  it("should render with default variant", () => {
    const html = renderCard({ children: "Content" });
    expect(html).toContain("bg-white");
    expect(html).toContain("border border-gray-200");
    expect(html).toContain("shadow-card");
    expect(html).toContain("rounded-xl");
  });

  it("should render with title", () => {
    const html = renderCard({ title: "Policy Details", children: "Content" });
    expect(html).toContain("Policy Details");
    expect(html).toContain("text-lg font-semibold");
  });

  it("should render with description", () => {
    const html = renderCard({
      title: "Card",
      description: "A helpful description",
      children: "Content",
    });
    expect(html).toContain("A helpful description");
    expect(html).toContain("text-sm text-gray-500");
  });

  it("should render outlined variant", () => {
    const html = renderCard({ children: "Content", variant: "outlined" });
    expect(html).toContain("border-2 border-gray-300");
    expect(html).not.toContain("shadow-card");
  });

  it("should render elevated variant", () => {
    const html = renderCard({ children: "Content", variant: "elevated" });
    expect(html).toContain("shadow-card-hover");
  });

  it("should render with no padding", () => {
    const html = renderCard({ children: "Content", padding: "none" });
    expect(html).not.toContain("p-");
  });

  it("should render with small padding", () => {
    const html = renderCard({ children: "Content", padding: "sm" });
    expect(html).toContain("p-4");
  });

  it("should render with large padding", () => {
    const html = renderCard({ children: "Content", padding: "lg" });
    expect(html).toContain("p-8");
  });

  it("should apply custom class", () => {
    const html = renderCard({ children: "Content", className: "custom-card" });
    expect(html).toContain("custom-card");
  });

  it("should not render title when not provided", () => {
    const html = renderCard({ children: "Content" });
    expect(html).not.toContain("<h3");
  });

  it("should not render description when not provided", () => {
    const html = renderCard({ children: "Content" });
    expect(html).not.toContain("<p");
  });

  it("should render children content", () => {
    const html = renderCard({ children: "<span>Inner content</span>" });
    expect(html).toContain("<span>Inner content</span>");
  });

  it("should have proper content structure", () => {
    const html = renderCard({
      title: "Test",
      description: "Desc",
      children: "Body",
    });
    expect(html.indexOf("Test")).toBeLessThan(html.indexOf("Desc"));
    expect(html.indexOf("Desc")).toBeLessThan(html.indexOf("Body"));
  });
});
