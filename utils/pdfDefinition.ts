import type { TDocumentDefinitions } from "pdfmake/interfaces";
import type { Customer, Invoice, InvoiceItem } from "../types";

const PURPLE_DARK = "#4B2983";
const PURPLE_LIGHT = "#EAE4F3";
const BORDER_GRAY = "#D1D5DB";
const TEXT_GRAY = "#1F2937";
const PRIMARY_FONT = "Roboto";
const DEFAULT_FONT_SIZE = 8;
const PAGE_MARGIN_HORIZONTAL = 20;
const PAGE_MARGIN_VERTICAL = 30;

const sanitizeNumber = (value: number | string | null | undefined): number => {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(numeric) ? Number(numeric) : 0;
};

const formatQuantity = (value: number): string => {
  const numeric = sanitizeNumber(value);
  if (Number.isInteger(numeric)) {
    return numeric.toString();
  }
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value: number): string =>
  sanitizeNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercentage = (value: number): string =>
  sanitizeNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const normalizeDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string | Date | null | undefined): string => {
  const date = normalizeDate(value);
  if (!date) return "";
  const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const day = String(local.getDate()).padStart(2, "0");
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const year = local.getFullYear();
  return `${day}/${month}/${year}`;
};

const buildCustomerBlock = (customer: Customer | null) => {
  const lines: Array<{ text: string; bold?: boolean }> = [];

  if (!customer) {
    lines.push(
      { text: "Company Name: 01infinito LLC placeholder", bold: true },
      { text: "123 Main Street" }
    );
    return lines.map((entry) => ({ ...entry, margin: [0, 1, 0, 1] }));
  }

  lines.push({ text: `Company Name: ${customer.name}`, bold: true });

  if (customer.address) {
    const parts = customer.address
      .split(",")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (parts.length > 0) {
      lines.push({ text: parts[0] });
    }
    if (parts.length > 1) {
      lines.push({ text: parts.slice(1).join(", ") });
    }
  }

  lines.push({
    text: `Tax ID / EIN: ${customer.taxId ?? ""}`,
    bold: true,
  });

  return lines.map((entry) => ({ ...entry, margin: [0, 1, 0, 1] }));
};

const resolveContactPerson = (customer: Customer | null): string => {
  if (!customer) {
    return "SEBASTIAN CECCONI";
  }
  const candidate = (customer as Customer & { contactPerson?: string }).contactPerson;
  return candidate && candidate.trim().length > 0
    ? candidate
    : "SEBASTIAN CECCONI";
};

const buildItemRow = (item: InvoiceItem, index: number) => {
  const rowFill = index % 2 === 1 ? PURPLE_LIGHT : undefined;
  return [
    { text: String(index + 1), alignment: "center", fillColor: rowFill },
    { text: item.description ?? "", fillColor: rowFill },
    {
      text: formatQuantity(item.quantity),
      alignment: "center",
      fillColor: rowFill,
    },
    {
      text: formatCurrency(item.price),
      alignment: "right",
      fillColor: rowFill,
    },
    {
      text: formatCurrency(item.quantity * item.price),
      alignment: "right",
      bold: true,
      fillColor: rowFill,
    },
  ];
};

const buildPlaceholderRow = (index: number, offset: number) => {
  const rowFill = (index + offset) % 2 === 1 ? PURPLE_LIGHT : undefined;
  return [
    { text: " ", alignment: "center", fillColor: rowFill },
    { text: " ", fillColor: rowFill },
    { text: " ", alignment: "center", fillColor: rowFill },
    { text: " ", alignment: "right", fillColor: rowFill },
    { text: " ", alignment: "right", fillColor: rowFill },
  ];
};

export const buildInvoicePdfDefinition = (
  invoice: Invoice,
  customer: Customer | null
): TDocumentDefinitions => {
  const subtotal = invoice.items.reduce(
    (acc, item) => acc + sanitizeNumber(item.quantity) * sanitizeNumber(item.price),
    0
  );
  const taxRate = sanitizeNumber(invoice.taxRate);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const shippingHandling = 0;
  const other = 0;

  const billToBlock = buildCustomerBlock(customer);
  const shipToBlock = buildCustomerBlock(customer);

  const itemsRows = invoice.items.map((item, index) =>
    buildItemRow(item, index)
  );
  const fillerCount = Math.max(6 - invoice.items.length, 0);
  const fillerRows = Array.from({ length: fillerCount }, (_, fillerIndex) =>
    buildPlaceholderRow(fillerIndex, invoice.items.length)
  );

  const notesText = (invoice.notes ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  return {
    info: {
      title: `Factura-${invoice.invoiceNumber}`,
    },
    pageSize: "A4",
    pageMargins: [
      PAGE_MARGIN_HORIZONTAL,
      PAGE_MARGIN_VERTICAL,
      PAGE_MARGIN_HORIZONTAL,
      PAGE_MARGIN_VERTICAL,
    ],
    defaultStyle: {
      font: PRIMARY_FONT,
      fontSize: DEFAULT_FONT_SIZE,
      color: TEXT_GRAY,
      lineHeight: 1.25,
    },
    styles: {
      tableLabel: {
        color: TEXT_GRAY,
      },
      tableValue: {
        color: "#FFFFFF",
        bold: true,
        alignment: "right",
      },
      sectionHeading: {
        color: "#111827",
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 4],
      },
      itemHeader: {
        color: "#FFFFFF",
        bold: true,
        alignment: "center",
      },
      itemHeaderLeft: {
        color: "#FFFFFF",
        bold: true,
        alignment: "left",
      },
      itemHeaderRight: {
        color: "#FFFFFF",
        bold: true,
        alignment: "right",
      },
      totalsHeaderLabel: {
        color: "#FFFFFF",
        bold: true,
      },
      totalsHeaderValue: {
        color: "#FFFFFF",
        bold: true,
        alignment: "right",
      },
      totalsLabel: {
        bold: false,
      },
      totalsValue: {
        alignment: "right",
      },
      totalsHighlightLabel: {
        bold: true,
      },
      totalsHighlightValue: {
        alignment: "right",
        bold: true,
      },
    },
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              {
                text: "INVOICE",
                fontSize: 24,
                bold: true,
                color: "#111827",
                margin: [0, 0, 0, 4],
              },
            ],
          },
          {
            width: 220,
            table: {
              widths: [100, "*"],
              body: [
                [
                  { text: "DATE", style: "tableLabel" },
                  { text: formatDate(invoice.date), style: "tableValue" },
                ],
                [
                  { text: "INVOICE NO.", style: "tableLabel" },
                  { text: invoice.invoiceNumber || "N/A", style: "tableValue" },
                ],
                [
                  { text: "CUSTOMER NO.", style: "tableLabel" },
                  {
                    text: customer?.taxId || "001",
                    style: "tableValue",
                  },
                ],
              ],
            },
            layout: {
              fillColor: (_rowIndex: number, _node: any, columnIndex: number) =>
                columnIndex === 1 ? PURPLE_DARK : undefined,
              hLineColor: () => BORDER_GRAY,
              vLineColor: () => BORDER_GRAY,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 6,
              paddingBottom: () => 6,
            },
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 16],
      },
      {
        stack: [
          {
            text: "Company Name: 01 INFINITO LLC",
            style: "sectionHeading",
          },
          { text: "407 LINCOLN RD SUITE 11K" },
          { text: "MIAMI BEACH, FL 33139" },
          { text: "Email Address: secceconi@01infinito.com" },
          { text: "Point of Contact" },
        ],
        margin: [0, 0, 0, 16],
      },
      {
        columns: [
          {
            width: "*",
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    text: "BILL TO:",
                    fillColor: PURPLE_DARK,
                    color: "#FFFFFF",
                    bold: true,
                    margin: [0, 2, 0, 2],
                  },
                ],
                [
                  {
                    stack: billToBlock,
                    margin: [0, 4, 0, 4],
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => BORDER_GRAY,
              vLineColor: () => BORDER_GRAY,
              paddingLeft: (rowIndex: number) => (rowIndex === 0 ? 8 : 8),
              paddingRight: () => 8,
              paddingTop: (rowIndex: number) => (rowIndex === 0 ? 4 : 4),
              paddingBottom: (rowIndex: number) => (rowIndex === 0 ? 4 : 4),
            },
          },
          {
            width: "*",
            table: {
              widths: ["*"],
              body: [
                [
                  {
                    text: "SHIP TO:",
                    fillColor: PURPLE_DARK,
                    color: "#FFFFFF",
                    bold: true,
                    margin: [0, 2, 0, 2],
                  },
                ],
                [
                  {
                    stack: shipToBlock,
                    margin: [0, 4, 0, 4],
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => BORDER_GRAY,
              vLineColor: () => BORDER_GRAY,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
          },
        ],
        columnGap: 14,
        margin: [0, 0, 0, 16],
      },

      {
        columns: [
          {
            width: "*",
            stack: [
              {
                table: {
                  headerRows: 1,
                  widths: [45, "*", 45, 65, 70],
                  body: [
                    [
                      {
                        text: "ITEM NO.",
                        style: "itemHeader",
                        fillColor: PURPLE_DARK,
                      },
                      {
                        text: "DESCRIPTION",
                        style: "itemHeaderLeft",
                        fillColor: PURPLE_DARK,
                        alignment: "left",
                      },
                      {
                        text: "QTY",
                        style: "itemHeader",
                        fillColor: PURPLE_DARK,
                      },
                      {
                        text: "UNIT PRICE",
                        style: "itemHeaderRight",
                        fillColor: PURPLE_DARK,
                      },
                      {
                        text: "TOTAL",
                        style: "itemHeaderRight",
                        fillColor: PURPLE_DARK,
                      },
                    ],
                    ...itemsRows,
                    ...fillerRows,
                  ],
                },
                layout: {
                  hLineColor: () => BORDER_GRAY,
                  vLineColor: () => BORDER_GRAY,
                  paddingLeft: () => 6,
                  paddingRight: () => 6,
                  paddingTop: () => 6,
                  paddingBottom: () => 6,
                },
              },
              {
                margin: [0, 12, 0, 0],
                stack: [
                  { text: "Remarks / Instructions:", bold: true, margin: [0, 0, 0, 6] },
                  {
                    table: {
                      widths: ["*"],
                      body: [
                        [
                          {
                            text: notesText || " ",
                            lineHeight: 1.3,
                          },
                        ],
                      ],
                    },
                    layout: {
                      hLineColor: () => BORDER_GRAY,
                      vLineColor: () => BORDER_GRAY,
                      paddingLeft: () => 8,
                      paddingRight: () => 8,
                      paddingTop: () => 10,
                      paddingBottom: () => 40,
                    },
                  },
                ],
              },
            ],
          },
          {
            width: 185,
            table: {
              widths: ["*", 70],
              body: [
                [
                  {
                    text: "SUBTOTAL",
                    style: "totalsHeaderLabel",
                    fillColor: PURPLE_DARK,
                  },
                  {
                    text: formatCurrency(subtotal),
                    style: "totalsHeaderValue",
                    fillColor: PURPLE_DARK,
                  },
                ],
                [
                  {
                    text: `TAX ${formatPercentage(taxRate)}%`,
                    style: "totalsLabel",
                  },
                  { text: formatCurrency(taxAmount), style: "totalsValue" },
                ],
                [
                  { text: "SHIPPING / HANDLING", style: "totalsLabel" },
                  {
                    text: formatCurrency(shippingHandling),
                    style: "totalsValue",
                  },
                ],
                [
                  {
                    text: "OTHER",
                    style: "totalsHighlightLabel",
                    fillColor: PURPLE_LIGHT,
                  },
                  {
                    text: formatCurrency(other),
                    style: "totalsHighlightValue",
                    fillColor: PURPLE_LIGHT,
                  },
                ],
                [
                  {
                    text: "TOTAL",
                    style: "totalsHeaderLabel",
                    fillColor: PURPLE_DARK,
                    fontSize: 14,
                  },
                  {
                    text: formatCurrency(total),
                    style: "totalsHeaderValue",
                    fillColor: PURPLE_DARK,
                    fontSize: 14,
                  },
                ],
              ],
            },
            layout: {
              hLineColor: () => BORDER_GRAY,
              vLineColor: () => BORDER_GRAY,
              paddingLeft: () => 8,
              paddingRight: () => 8,
              paddingTop: () => 10,
              paddingBottom: () => 10,
            },
          },
        ],
        columnGap: 14,
        margin: [0, 0, 0, 24],
      },
      {
        table: {
          widths: ["*", "*"],
          body: [
            [
              {
                text: "DATE",
                fillColor: PURPLE_DARK,
                color: "#FFFFFF",
                bold: true,
                alignment: "center",
              },
              {
                text: "AUTHORIZED SIGNATURE",
                fillColor: PURPLE_DARK,
                color: "#FFFFFF",
                bold: true,
                alignment: "center",
              },
            ],
            [
              {
                text: formatDate(invoice.date),
                alignment: "center",
                border: [true, false, true, true],
              },
              {
                text: resolveContactPerson(customer),
                alignment: "center",
                bold: true,
                border: [true, false, true, true],
              },
            ],
          ],
        },
        layout: {
          hLineColor: () => BORDER_GRAY,
          vLineColor: () => BORDER_GRAY,
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
      },
      {
        margin: [0, 16, 0, 0],
        alignment: "center",
        stack: [
          { text: "For questions concerning this purchase order, please contact" },
          { text: "Sebastian Cecconi, secceconi@01infinito.com", bold: true },
          {
            text: "www.01infinito.com",
            bold: true,
            color: "#2563EB",
            margin: [0, 4, 0, 0],
          },
        ],
      },
    ],
  };
};
