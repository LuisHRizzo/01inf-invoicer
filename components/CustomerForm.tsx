import React, { useEffect, useState } from "react";
import type { Customer } from "../src/types";

interface CustomerFormProps {
  initialCustomer?: Omit<Customer, "id"> | null;
  onCustomerChange: (customer: Omit<Customer, "id">) => void;
}

const emptyCustomer: Omit<Customer, "id"> = {
  name: "",
  address: "",
  email: "",
  taxId: "",
};

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialCustomer = null,
  onCustomerChange,
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

  useEffect(() => {
    onCustomerChange(customer);
  }, [customer, onCustomerChange]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default CustomerForm;