export interface Customer {
    id: string;
    name: string;
    address: string;
    email: string;
    taxId: string;
}

export type ServiceCategory = 'service' | 'product';

export interface Service {
    id: string;
    description: string;
    price: number;
    category: ServiceCategory;
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    customerId: string | null;
    items: InvoiceItem[];
    notes: string;
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
    status: 'Borrador' | 'Guardada';
}