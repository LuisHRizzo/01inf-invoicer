import React, { useState, useCallback } from "react";
import type { Customer } from "../src/types";
import CustomerForm from "./CustomerForm"; // Importar CustomerForm

interface CustomerModalProps {
  onSave: (customer: Omit<Customer, "id">) => void;
  onClose: () => void;
  initialCustomer?: Omit<Customer, "id"> | null;
  title?: string;
  confirmLabel?: string;
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  onSave,
  onClose,
  initialCustomer = null,
  title,
  confirmLabel,
}) => {
  const [customerData, setCustomerData] = useState<Omit<Customer, "id">>(
    initialCustomer || { name: "", address: "", email: "", taxId: "" }
  );

  const modalTitle = title ?? (initialCustomer ? "Editar Cliente" : "Nuevo Cliente");
  const submitLabel = confirmLabel ?? (initialCustomer ? "Guardar Cambios" : "Guardar Cliente");

  const handleCustomerChange = useCallback((newCustomer: Omit<Customer, "id">) => {
    setCustomerData(newCustomer);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (customerData.name.trim() && customerData.email.trim()) {
      onSave(customerData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{modalTitle}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CustomerForm
            initialCustomer={initialCustomer}
            onCustomerChange={handleCustomerChange}
          />
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
