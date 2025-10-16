import React, { useEffect, useState } from "react";
import type { Customer } from "../types";

interface CustomerModalProps {
  onSave: (customer: Omit<Customer, "id">) => void;
  onClose: () => void;
  initialCustomer?: Omit<Customer, "id"> | null;
  title?: string;
  confirmLabel?: string;
}

const emptyCustomer: Omit<Customer, "id"> = {
  name: "",
  address: "",
  email: "",
  taxId: "",
};

const CustomerModal: React.FC<CustomerModalProps> = ({
  onSave,
  onClose,
  initialCustomer = null,
  title,
  confirmLabel,
}) => {
  const [customer, setCustomer] = useState(emptyCustomer);

  useEffect(() => {
    if (initialCustomer) {
      setCustomer({
        name: initialCustomer.name ?? "",
        address: initialCustomer.address ?? "",
        email: initialCustomer.email ?? "",
        taxId: initialCustomer.taxId ?? "",
      });
    } else {
      setCustomer(emptyCustomer);
    }
  }, [initialCustomer]);

  const modalTitle = title ?? (initialCustomer ? "Editar Cliente" : "Nuevo Cliente");
  const submitLabel = confirmLabel ?? (initialCustomer ? "Guardar Cambios" : "Guardar Cliente");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (customer.name.trim() && customer.email.trim()) {
      onSave({
        name: customer.name.trim(),
        email: customer.email.trim(),
        address: customer.address.trim(),
        taxId: customer.taxId.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{modalTitle}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre completo o Razon Social
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={customer.name}
              onChange={handleChange}
              required
              className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={customer.email}
              onChange={handleChange}
              required
              className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Direccion
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={customer.address}
              onChange={handleChange}
              className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
              NIF/CIF
            </label>
            <input
              type="text"
              name="taxId"
              id="taxId"
              value={customer.taxId}
              onChange={handleChange}
              className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
