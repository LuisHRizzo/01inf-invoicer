import React from 'react';
import type { Invoice, Customer, Service } from '../types';
import InvoiceItemsTable from './InvoiceItemsTable';
import { AddIcon } from './Icons';

interface InvoiceFormProps {
    invoice: Invoice;
    setInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
    customers: Customer[];
    services: Service[];
    onCreateCustomer: () => void;
    onCreateService: () => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, setInvoice, customers, services, onCreateCustomer, onCreateService }) => {
    
    const handleInvoiceDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setInvoice(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
    };
    
    const handleCustomerChange = (customerId: string) => {
        setInvoice(prev => prev ? { ...prev, customerId } : null);
    };

    const handleTaxRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
        setInvoice(prev => prev ? { ...prev, taxRate: isNaN(value) ? 0 : value } : null);
    };

    if (!invoice) return null;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Facturar a:</label>
                    <div className="flex items-center gap-2">
                        <select
                            id="customer"
                            value={invoice.customerId || ''}
                            onChange={(e) => handleCustomerChange(e.target.value)}
                            className="bg-white flex-grow mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                            <option value="" disabled>Seleccionar un cliente</option>
                            {customers.map((customer) => (
                                <option key={customer.id} value={customer.id}>{customer.name}</option>
                            ))}
                        </select>
                        <button onClick={onCreateCustomer} className="mt-1 p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md" title="Añadir nuevo cliente">
                            <AddIcon />
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">Nº de Factura</label>
                    <input
                        type="text"
                        name="invoiceNumber"
                        id="invoiceNumber"
                        value={invoice.invoiceNumber}
                        onChange={handleInvoiceDetailsChange}
                        className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Emisión</label>
                    <input
                        type="date"
                        name="date"
                        id="date"
                        value={invoice.date}
                        onChange={handleInvoiceDetailsChange}
                        className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                    <input
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        value={invoice.dueDate}
                        onChange={handleInvoiceDetailsChange}
                        className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                 <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold text-gray-800">Servicios / Productos</h3>
                     <button
                        type="button"
                        onClick={onCreateService}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200"
                    >
                        <AddIcon />
                        Nuevo servicio
                    </button>
                 </div>
                 <InvoiceItemsTable 
                    items={invoice.items} 
                    setItems={(newItems) => setInvoice(prev => prev ? { ...prev, items: newItems } : null)}
                    services={services}
                 />
            </div>

            <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={invoice.notes}
                        onChange={handleInvoiceDetailsChange}
                        className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Información adicional, términos de pago, etc."
                    ></textarea>
                </div>
                <div className="space-y-2">
                    <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">Tasa de Impuesto (%)</label>
                     <input
                        type="number"
                        name="taxRate"
                        id="taxRate"
                        value={invoice.taxRate}
                        onChange={handleTaxRateChange}
                        className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        min="0"
                    />
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
