import React, { useState, useEffect } from "react";
import { Customer, Invoice } from "../types";
import { getCustomers, saveCustomer, deleteCustomer } from "../api/customers";

export const useCustomers = (
  setView: (view: "list" | "editor") => void,
  setActiveSection: (section: "invoices" | "services" | "customers") => void,
  customerModalState: {
    isOpen: boolean;
    initialCustomer: Customer | null;
    context: "invoices" | "customers";
    editingId: string | null;
  },
  closeCustomerModal: () => void,
  setCurrentInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>
) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersData = await getCustomers();
        setCustomers(customersData);
      } catch (e: unknown) {
        let errorMessage = "No se pudieron cargar los clientes.";
        if (e instanceof Error) {
          errorMessage = `No se pudieron cargar los clientes. (${e.message})`;
        }
        setError(errorMessage);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const handleSaveCustomer = async (customerPayload: Omit<Customer, "id">) => {
    try {
      const isEditing = Boolean(customerModalState.editingId);
      const customerId = customerModalState.editingId;
      const savedCustomer = await saveCustomer(customerPayload, customerId);

      setCustomers((prev) => {
        const updated = isEditing
          ? prev.map((existing) =>
              existing.id === savedCustomer.id ? savedCustomer : existing
            )
          : [...prev, savedCustomer];
        return [...updated].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
 
       if (!isEditing && customerModalState.context === "invoices") {
         setCurrentInvoice((prev: Invoice | null) =>
           prev ? { ...prev, customerId: savedCustomer.id } : null
         );
       }
 
       if (customerModalState.context === "customers") {
         setView("list");
         setActiveSection("customers");
       }

      closeCustomerModal();
    } catch (e) {
      console.error(e);
      alert("Error al guardar el cliente.");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm("Estas seguro de que deseas eliminar este cliente?")) {
      return;
    }
    try {
      await deleteCustomer(customerId);
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== customerId)
      );
      setCurrentInvoice((prev: Invoice | null) =>
        prev && prev.customerId === customerId ? { ...prev, customerId: null } : prev
      );
    } catch (e: unknown) {
      console.error(e);
      let errorMessage = "Error al eliminar el cliente.";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      alert(errorMessage);
    }
  };

  return {
    customers,
    setCustomers,
    loading,
    error,
    handleSaveCustomer,
    handleDeleteCustomer,
  };
};