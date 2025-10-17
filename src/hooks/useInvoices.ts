import { useState, useEffect } from "react";
import { Invoice, Customer } from "../types";
import { getInvoices, deleteInvoice, saveInvoice, normalizeDate } from "../api/invoices";
import { generateNewInvoiceNumber } from "../../utils/invoiceHelpers";

export const useInvoices = (customers: Customer[], setView: (view: "list" | "editor") => void, setActiveSection: (section: "invoices" | "services" | "customers") => void, setCurrentInvoice: (invoice: Invoice | null) => void) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesData = await getInvoices();
        const normalizedInvoices = invoicesData.map((invoice) => ({
          ...invoice,
          date: normalizeDate(
            invoice.date,
            new Date().toISOString().split("T")[0]
          ),
          dueDate: normalizeDate(
            invoice.dueDate,
            invoice.date || new Date().toISOString().split("T")[0]
          ),
        }));
        setInvoices(normalizedInvoices);
      } catch (e: unknown) {
        let errorMessage = "No se pudieron cargar las facturas.";
        if (e instanceof Error) {
          errorMessage = `No se pudieron cargar las facturas. (${e.message})`;
        }
        setError(errorMessage);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleCreateNewInvoice = () => {
    const newInvoiceNumber = generateNewInvoiceNumber(invoices.length);
    setCurrentInvoice({
      id: crypto.randomUUID(),
      invoiceNumber: newInvoiceNumber,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
        .toISOString()
        .split("T")[0],
      customerId: customers.length > 0 ? customers[0].id : null,
      items: [
        { id: crypto.randomUUID(), description: "", quantity: 1, price: 0 },
      ],
      notes: `Account details
01 INFINITO LLC
Bank Account Info - Wise US inc.
108 W 13th St, Wilmington, 19801, United States

Account Number: 219773714368
Routing Number: 101019628
Swift/BIC: TRWIUS35XXX`,
      subtotal: 0,
      tax: 0,
      taxRate: 21,
      total: 0,
      status: "Borrador",
    });
    setActiveSection("invoices");
    setView("editor");
  };

  const handleEditInvoice = (invoiceId: string) => {
    const invoiceToEdit = invoices.find((inv) => inv.id === invoiceId);
    if (invoiceToEdit) {
      setCurrentInvoice({
        ...invoiceToEdit,
        date: normalizeDate(
          invoiceToEdit.date,
          new Date().toISOString().split("T")[0]
        ),
        dueDate: normalizeDate(
          invoiceToEdit.dueDate,
          invoiceToEdit.date || new Date().toISOString().split("T")[0]
        ),
      });
      setActiveSection("invoices");
      setView("editor");
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta factura?")) {
      try {
        await deleteInvoice(invoiceId);
        setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
      } catch (e) {
        console.error(e);
        alert("Error al eliminar la factura.");
      }
    }
  };

  const handleSaveInvoice = async (invoiceToSave: Invoice) => {
    const finalInvoice: Invoice = {
      ...invoiceToSave,
      status: "Guardada",
    };

    const normalizedInvoice = {
      ...finalInvoice,
      date: normalizeDate(
        finalInvoice.date,
        new Date().toISOString().split("T")[0]
      ),
      dueDate: normalizeDate(
        finalInvoice.dueDate,
        finalInvoice.date ||
          new Date(new Date().setDate(new Date().getDate() + 30))
            .toISOString()
            .split("T")[0]
      ),
    };

    const isNew = !invoices.some((inv) => inv.id === finalInvoice.id);
    
    try {
      const savedInvoice = await saveInvoice(normalizedInvoice, isNew);

      if (isNew) {
        setInvoices((prev) => [...prev, savedInvoice]);
      } else {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === savedInvoice.id ? savedInvoice : inv))
        );
      }
      setView("list");
      setCurrentInvoice(null);
    } catch (e) {
      console.error(e);
      alert("Error al guardar la factura.");
    }
  };

  return {
    invoices,
    setInvoices,
    loading,
    error,
    handleCreateNewInvoice,
    handleEditInvoice,
    handleDeleteInvoice,
    handleSaveInvoice,
  };
};
