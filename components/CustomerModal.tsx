import React, { useState } from 'react';
import type { Customer } from '../types';

interface CustomerModalProps {
    onSave: (customer: Omit<Customer, 'id'>) => void;
    onClose: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ onSave, onClose }) => {
    const [customer, setCustomer] = useState({
        name: '',
        address: '',
        email: '',
        taxId: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCustomer({ ...customer, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (customer.name && customer.email) {
            onSave(customer);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Añadir Nuevo Cliente</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre completo o Razón Social</label>
                        <input type="text" name="name" id="name" value={customer.name} onChange={handleChange} required className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" value={customer.email} onChange={handleChange} required className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
                        <input type="text" name="address" id="address" value={customer.address} onChange={handleChange} className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div>
                        <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">NIF/CIF</label>
                        <input type="text" name="taxId" id="taxId" value={customer.taxId} onChange={handleChange} className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="pt-4 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                            Guardar Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerModal;