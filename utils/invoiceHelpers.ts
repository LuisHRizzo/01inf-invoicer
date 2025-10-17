// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Invoice, InvoiceItem } from '../src/types';

export const generateNewInvoiceNumber = (invoicesLength: number): string => {
  return `FACT-${(invoicesLength + 1).toString().padStart(3, "0")}`;
};

export const calculateInvoiceTotals = (invoice: Invoice) => {
  const subtotal = invoice.items.reduce(
    (acc, item) => acc + item.quantity * item.price,
    0
  );
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export const sanitizeInvoice = (invoice: Invoice): Invoice => {
  return {
    ...invoice,
    items: invoice.items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      price: Number(item.price),
    })),
    taxRate: Number(invoice.taxRate),
  };
};