import { Invoice } from "../types";

const API_BASE_URL = (process.env.VITE_APP_BACKEND_URL ?? '').replace(/\/+$/, '');

export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await fetch(`${API_BASE_URL}/api/data`);
  if (!response.ok) {
    throw new Error(`Error en la red: ${response.statusText}`);
  }
  const data = await response.json();
  return data.invoices;
};

export const deleteInvoice = async (invoiceId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("No se pudo eliminar la factura");
};

export const saveInvoice = async (invoice: Invoice, isNew: boolean): Promise<Invoice> => {
  const method = isNew ? "POST" : "PUT";
  const url = isNew
    ? `${API_BASE_URL}/api/invoices`
    : `${API_BASE_URL}/api/invoices/${invoice.id}`;

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoice),
  });
  if (!response.ok) throw new Error("No se pudo guardar la factura.");
  return response.json();
};

// Helper para normalizar fechas, movido de App.tsx
export const normalizeDate = (value: unknown, fallback: string) => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split("/");
      return `${year}-${month}-${day}`;
    }
    return trimmed;
  }
  return fallback;
};
