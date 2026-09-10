import { describe, it, expect } from "vitest";

interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "select" | "textarea" | "date";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface FormProps {
  fields: Field[];
  values: Record<string, string | number>;
  errors: Record<string, string>;
  onChange: (name: string, value: string | number) => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

function renderInput(field: Field, value: string | number, error?: string): string {
  const baseClasses = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500";
  const errorClasses = error ? "border-red-500" : "border-gray-300";

  let input = "";
  switch (field.type) {
    case "textarea":
      input = `<textarea name="${field.name}" class="${baseClasses} ${errorClasses}" placeholder="${field.placeholder || ""}" ${field.required ? "required" : ""}>${value || ""}</textarea>`;
      break;
    case "select":
      input = `<select name="${field.name}" class="${baseClasses} ${errorClasses}" ${field.required ? "required" : ""}>`;
      input += `<option value="">Select ${field.label}</option>`;
      field.options?.forEach((opt) => {
        input += `<option value="${opt.value}" ${value === opt.value ? "selected" : ""}>${opt.label}</option>`;
      });
      input += "</select>";
      break;
    default:
      input = `<input type="${field.type || "text"}" name="${field.name}" value="${value || ""}" class="${baseClasses} ${errorClasses}" placeholder="${field.placeholder || ""}" ${field.required ? "required" : ""} />`;
  }

  let html = `<div class="form-group">`;
  html += `<label class="block text-sm font-medium text-gray-700 mb-1">${field.label}${field.required ? " *" : ""}</label>`;
  html += input;
  if (error) {
    html += `<p class="mt-1 text-sm text-red-500">${error}</p>`;
  }
  html += "</div>";
  return html;
}

function renderForm(props: FormProps): string {
  const classes = ["space-y-4", props.className || ""].filter(Boolean).join(" ");

  let html = `<form class="${classes}" onsubmit="event.preventDefault()">`;
  for (const field of props.fields) {
    html += renderInput(field, props.values[field.name], props.errors[field.name]);
  }
  html += `<button type="submit" class="w-full bg-brand-600 text-white py-2 px-4 rounded-lg hover:bg-brand-700" ${props.loading ? "disabled" : ""}>${props.loading ? "Loading..." : props.submitLabel || "Submit"}</button>`;
  html += "</form>";
  return html;
}

describe("Form Component", () => {
  const basicFields: Field[] = [
    { name: "email", label: "Email", type: "email", required: true },
    { name: "password", label: "Password", type: "password", required: true },
  ];

  const defaultProps: FormProps = {
    fields: basicFields,
    values: { email: "", password: "" },
    errors: {},
    onChange: () => {},
    onSubmit: () => {},
  };

  it("should render form with fields", () => {
    const html = renderForm(defaultProps);
    expect(html).toContain("Email");
    expect(html).toContain("Password");
    expect(html).toContain('<form');
  });

  it("should render required indicator", () => {
    const html = renderForm(defaultProps);
    expect(html).toContain("Email *");
    expect(html).toContain("Password *");
  });

  it("should render text input by default", () => {
    const fields: Field[] = [{ name: "name", label: "Name" }];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain('type="text"');
  });

  it("should render email input", () => {
    const html = renderForm(defaultProps);
    expect(html).toContain('type="email"');
  });

  it("should render password input", () => {
    const html = renderForm(defaultProps);
    expect(html).toContain('type="password"');
  });

  it("should render number input", () => {
    const fields: Field[] = [{ name: "amount", label: "Amount", type: "number" }];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain('type="number"');
  });

  it("should render textarea", () => {
    const fields: Field[] = [
      { name: "description", label: "Description", type: "textarea" },
    ];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain("<textarea");
  });

  it("should render select dropdown", () => {
    const fields: Field[] = [
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Auto", value: "auto" },
          { label: "Home", value: "home" },
        ],
      },
    ];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain("<select");
    expect(html).toContain("<option");
    expect(html).toContain("Auto");
    expect(html).toContain("Home");
  });

  it("should render date input", () => {
    const fields: Field[] = [{ name: "date", label: "Date", type: "date" }];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain('type="date"');
  });

  it("should display field values", () => {
    const html = renderForm({
      ...defaultProps,
      values: { email: "test@example.com", password: "secret" },
    });
    expect(html).toContain('value="test@example.com"');
    expect(html).toContain('value="secret"');
  });

  it("should display error messages", () => {
    const html = renderForm({
      ...defaultProps,
      errors: { email: "Email is required" },
    });
    expect(html).toContain("Email is required");
    expect(html).toContain("text-red-500");
  });

  it("should apply error styling", () => {
    const html = renderForm({
      ...defaultProps,
      errors: { email: "Invalid" },
    });
    expect(html).toContain("border-red-500");
  });

  it("should render submit button", () => {
    const html = renderForm(defaultProps);
    expect(html).toContain("Submit");
    expect(html).toContain('type="submit"');
  });

  it("should render custom submit label", () => {
    const html = renderForm({
      ...defaultProps,
      submitLabel: "Create Policy",
    });
    expect(html).toContain("Create Policy");
  });

  it("should render loading state", () => {
    const html = renderForm({ ...defaultProps, loading: true });
    expect(html).toContain("Loading...");
    expect(html).toContain("disabled");
  });

  it("should render placeholder", () => {
    const fields: Field[] = [
      { name: "search", label: "Search", placeholder: "Search policies..." },
    ];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain('placeholder="Search policies..."');
  });

  it("should render custom class", () => {
    const html = renderForm({
      ...defaultProps,
      className: "my-custom-form",
    });
    expect(html).toContain("my-custom-form");
  });

  it("should render multiple fields", () => {
    const fields: Field[] = [
      { name: "f1", label: "Field 1" },
      { name: "f2", label: "Field 2" },
      { name: "f3", label: "Field 3" },
    ];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain("Field 1");
    expect(html).toContain("Field 2");
    expect(html).toContain("Field 3");
  });

  it("should mark required fields", () => {
    const fields: Field[] = [
      { name: "required", label: "Required", required: true },
      { name: "optional", label: "Optional" },
    ];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain("Required *");
    expect(html).not.toContain("Optional *");
  });

  it("should render select with default empty option", () => {
    const fields: Field[] = [
      {
        name: "type",
        label: "Type",
        type: "select",
        options: [{ label: "Auto", value: "auto" }],
      },
    ];
    const html = renderForm({ ...defaultProps, fields });
    expect(html).toContain("Select Type");
  });
});
