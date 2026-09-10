import { describe, it, expect } from "vitest";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => string;
  className?: string;
}

interface TableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

function renderTable(props: TableProps): string {
  const classes = [
    "min-w-full divide-y divide-gray-200",
    props.className || "",
  ]
    .filter(Boolean)
    .join(" ");

  let html = `<table class="${classes}">`;

  html += "<thead><tr>";
  for (const col of props.columns) {
    html += `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ""}">${col.label}</th>`;
  }
  html += "</tr></thead>";

  html += "<tbody>";

  if (props.data.length === 0) {
    html += `<tr><td colspan="${props.columns.length}" class="px-6 py-12 text-center text-gray-500">${props.emptyMessage || "No data available"}</td></tr>`;
  } else {
    props.data.forEach((row, index) => {
      const rowClasses = [
        props.striped && index % 2 === 1 ? "bg-gray-50" : "",
        props.hoverable ? "hover:bg-gray-50" : "",
      ]
        .filter(Boolean)
        .join(" ");

      html += `<tr class="${rowClasses}">`;
      for (const col of props.columns) {
        const value = row[col.key];
        const content = col.render
          ? col.render(value, row)
          : String(value ?? "");
        html += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${content}</td>`;
      }
      html += "</tr>";
    });
  }

  html += "</tbody></table>";
  return html;
}

describe("Table Component", () => {
  const columns: Column[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
  ];

  const data = [
    { name: "John Doe", email: "john@example.com", status: "active" },
    { name: "Jane Smith", email: "jane@example.com", status: "pending" },
  ];

  it("should render table with headers", () => {
    const html = renderTable({ columns, data });
    expect(html).toContain("Name");
    expect(html).toContain("Email");
    expect(html).toContain("Status");
  });

  it("should render table rows", () => {
    const html = renderTable({ columns, data });
    expect(html).toContain("John Doe");
    expect(html).toContain("john@example.com");
    expect(html).toContain("Jane Smith");
  });

  it("should render empty state", () => {
    const html = renderTable({ columns, data: [] });
    expect(html).toContain("No data available");
  });

  it("should render custom empty message", () => {
    const html = renderTable({
      columns,
      data: [],
      emptyMessage: "No policies found",
    });
    expect(html).toContain("No policies found");
  });

  it("should render striped rows", () => {
    const html = renderTable({ columns, data, striped: true });
    expect(html).toContain("bg-gray-50");
  });

  it("should render hoverable rows", () => {
    const html = renderTable({ columns, data, hoverable: true });
    expect(html).toContain("hover:bg-gray-50");
  });

  it("should use custom render function", () => {
    const columnsWithRender: Column[] = [
      ...columns,
      {
        key: "status",
        label: "Status",
        render: (value) => {
          const status = String(value);
          const color = status === "active" ? "green" : "yellow";
          return `<span class="${color}">${status}</span>`;
        },
      },
    ];

    const html = renderTable({ columns: columnsWithRender, data });
    expect(html).toContain('<span class="green">active</span>');
  });

  it("should apply custom column class", () => {
    const customColumns: Column[] = [
      { key: "name", label: "Name", className: "w-1/3" },
      { key: "email", label: "Email" },
    ];

    const html = renderTable({ columns: customColumns, data });
    expect(html).toContain("w-1/3");
  });

  it("should apply custom table class", () => {
    const html = renderTable({ columns, data, className: "my-table" });
    expect(html).toContain("my-table");
  });

  it("should handle null values", () => {
    const dataWithNull = [
      { name: "John", email: null, status: "active" },
    ];

    const html = renderTable({ columns, data: dataWithNull });
    expect(html).toContain("John");
    expect(html).toContain("");
  });

  it("should set correct colspan for empty state", () => {
    const html = renderTable({ columns, data: [] });
    expect(html).toContain(`colspan="${columns.length}"`);
  });

  it("should render correct number of header cells", () => {
    const html = renderTable({ columns, data });
    const headerCells = (html.match(/<th/g) || []).length;
    expect(headerCells).toBe(columns.length);
  });

  it("should render correct number of body rows", () => {
    const html = renderTable({ columns, data });
    const rows = (html.match(/<tr/g) || []).length;
    expect(rows).toBe(data.length + 1);
  });
});
