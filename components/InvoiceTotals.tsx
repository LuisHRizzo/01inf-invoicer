import React from 'react';
import type { Invoice } from '../src/types';
import { calculateInvoiceTotals } from '../utils/invoiceHelpers';

interface InvoiceTotalsProps {
  invoice: Invoice;
}

const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({ invoice }) => {
  const { subtotal, tax, total } = calculateInvoiceTotals(invoice);

  return (
    <div className="space-y-2 text-right">
      <div className="flex justify-between">
        <span className="text-gray-700">Subtotal:</span>
        <span className="font-medium text-gray-900">
          {subtotal.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-700">Impuestos ({invoice.taxRate}%):</span>
        <span className="font-medium text-gray-900">
          {tax.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
        </span>
      </div>
      <div className="flex justify-between border-t border-gray-200 pt-2">
        <span className="text-lg font-semibold text-gray-800">Total:</span>
        <span className="text-lg font-bold text-blue-600">
          {total.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
        </span>
      </div>
    </div>
  );
};

export default InvoiceTotals;