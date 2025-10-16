import React from 'react';
import type { Invoice, Customer } from '../types';
import InvoicePreview from './InvoicePreview';

interface PrintableInvoiceProps {
  invoice: Invoice;
  customer: Customer | null;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, customer }) => {
  return (
    <div className="print-only">
      <InvoicePreview invoice={invoice} customer={customer} />
    </div>
  );
};

export default PrintableInvoice;