import React from 'react';
import type { InvoiceItem, Service } from '../types';
import { AddIcon, DeleteIcon } from './Icons';

interface InvoiceItemsTableProps {
    items: InvoiceItem[];
    setItems: (items: InvoiceItem[]) => void;
    services: Service[];
}

const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({ items, setItems, services }) => {

    const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
        const newItems = items.map(item => {
            if (item.id === id) {
                if (field === 'description') {
                    const selectedService = services.find(s => s.description === value);
                    if (selectedService) {
                        return { ...item, description: value as string, price: selectedService.price };
                    }
                }
                const numericValue = (field === 'quantity' || field === 'price') && typeof value === 'string' ? parseFloat(value) : value;
                return { ...item, [field]: (field !== 'description' && isNaN(numericValue as number)) ? 0 : value };
            }
            return item;
        });
        setItems(newItems);
    };

    const addItem = () => {
        const newItem: InvoiceItem = {
            id: crypto.randomUUID(),
            description: '',
            quantity: 1,
            price: 0
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };
    
    return (
        <div className="w-full">
            <datalist id="services-list">
                {services.map(service => (
                    <option
                        key={service.id}
                        value={service.description}
                        label={`${service.description} · ${service.category === 'product' ? 'Producto' : 'Servicio'} · ${Number(service.price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`}
                    />
                ))}
            </datalist>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Descripción</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th scope="col" className="relative px-4 py-3">
                                <span className="sr-only">Eliminar</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <input 
                                        type="text" 
                                        list="services-list"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        placeholder="Descripción del servicio"
                                        className="bg-white w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                    <input 
                                        type="number" 
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                        className="bg-white w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        min="0"
                                    />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                     <input 
                                        type="number" 
                                        value={item.price}
                                        onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                        className="bg-white w-28 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        min="0"
                                        step="0.01"
                                    />
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {(item.quantity * item.price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-800 disabled:opacity-50" disabled={items.length <= 1}>
                                        <DeleteIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button
                onClick={addItem}
                className="mt-4 flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
            >
                <AddIcon />
                Añadir línea
            </button>
        </div>
    );
};

export default InvoiceItemsTable;
