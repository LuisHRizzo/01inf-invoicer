import React, { useState, useEffect, useRef, useMemo } from "react";
import type { Invoice, Customer, Service } from "./types";
import InvoiceForm from "./components/InvoiceForm";
import InvoicePreview from "./components/InvoicePreview";
import CustomerModal from "./components/CustomerModal";
import ServiceModal from "./components/ServiceModal";
import {
  ExportIcon,
  AddIcon,
  EditIcon,
  DeleteIcon,
  BackIcon,
} from "./components/Icons";

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { buildInvoicePdfDefinition } from "./utils/pdfDefinition";

const resolvedFonts =
  (pdfFonts as any)?.pdfMake?.vfs ?? (pdfFonts as any)?.vfs ?? pdfFonts;
(pdfMake as any).vfs = resolvedFonts;
(pdfMake as any).fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};

const API_BASE_URL = (process.env.VITE_APP_BACKEND_URL ?? '').replace(/\/+$/, '');


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState<"list" | "editor">("list");
  const [activeSection, setActiveSection] = useState<"invoices" | "services" | "customers">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customerModalState, setCustomerModalState] = useState<{
    isOpen: boolean;
    initialCustomer: Customer | null;
    context: "invoices" | "customers";
    editingId: string | null;
  }>({
    isOpen: false,
    initialCustomer: null,
    context: "customers",
    editingId: null,
  });
  const [serviceModalState, setServiceModalState] = useState<{
    isOpen: boolean;
    initialService: Service | null;
    context: "invoices" | "services";
    editingId: string | null;
  }>({
    isOpen: false,
    initialService: null,
    context: "services",
    editingId: null,
  });
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    const query = serviceSearchTerm.trim().toLowerCase();
    if (!query) return services;

    return services.filter((service) => {
      const description = service.description?.toLowerCase() ?? "";
      const category = service.category?.toLowerCase() ?? "";
      const id = service.id?.toLowerCase() ?? "";
      const price = Number(service.price ?? 0)
        .toLocaleString("es-ES", {
          style: "currency",
          currency: "EUR",
        })
        .toLowerCase();

      return (
        description.includes(query) ||
        category.includes(query) ||
        id.includes(query) ||
        price.includes(query)
      );
    });
  }, [services, serviceSearchTerm]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearchTerm.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() ?? "";
      const address = customer.address?.toLowerCase() ?? "";
      const email = customer.email?.toLowerCase() ?? "";
      const taxId = customer.taxId?.toLowerCase() ?? "";
      const id = customer.id?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        address.includes(query) ||
        email.includes(query) ||
        taxId.includes(query) ||
        id.includes(query)
      );
    });
  }, [customers, customerSearchTerm]);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/data`);
        if (!response.ok) {
          throw new Error(`Error en la red: ${response.statusText}`);
        }
        const data = await response.json();
        setInvoices(data.invoices);
        setCustomers(data.customers);
        const normalizedServices: Service[] = (data.services || [])
          .map((service: any) => {
            const rawPrice =
              typeof service.price === "string"
                ? parseFloat(service.price)
                : service.price;
            return {
              ...service,
              category: service.category ?? "service",
              price: Number.isNaN(rawPrice) ? 0 : rawPrice,
            };
          })
          .sort((a: Service, b: Service) =>
            a.description.localeCompare(b.description)
          );
        setServices(normalizedServices);
      } catch (e: any) {
        setError(
          `No se pudieron cargar los datos. Asegúrate de que el servidor backend est�(c) en ejecución. (${e.message})`
        );
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleCreateNew = () => {
    const newInvoiceNumber = `FACT-${(invoices.length + 1)
      .toString()
      .padStart(3, "0")}`;
    setCurrentInvoice({
      id: crypto.randomUUID(), // Temp ID, server will generate real one
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
Swift/BIC: TRWIUS35XXX`, // ¡Usamos comillas invertidas (`)!
      subtotal: 0,
      tax: 0,
      taxRate: 21,
      total: 0,
      status: "Borrador",
    });
    setActiveSection("invoices");
    setView("editor");
  };

  const handleEdit = (invoiceId: string) => {
    const invoiceToEdit = invoices.find((inv) => inv.id === invoiceId);
    if (invoiceToEdit) {
      setCurrentInvoice(invoiceToEdit);
      setActiveSection("invoices");
      setView("editor");
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta factura?")) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/invoices/${invoiceId}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error("No se pudo eliminar la factura");
        setInvoices(invoices.filter((inv) => inv.id !== invoiceId));
      } catch (e) {
        console.error(e);
        alert("Error al eliminar la factura.");
      }
    }
  };

  const handleSaveInvoice = async () => {
    if (!currentInvoice) return;

    const normalizeDate = (value: unknown, fallback: string) => {
      if (value instanceof Date) {
        return value.toISOString().split("T")[0];
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return fallback;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
          const [day, month, year] = trimmed.split("/");
          return `${year}-${month}-${day}`;
        }
        return trimmed;
      }
      return fallback;
    };

    const subtotal = currentInvoice.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0
    );
    const tax = subtotal * (currentInvoice.taxRate / 100);
    const total = subtotal + tax;

    const finalInvoice: Invoice = {
      ...currentInvoice,
      subtotal,
      tax,
      total,
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
    const method = isNew ? "POST" : "PUT";
    const url = isNew
      ? `${API_BASE_URL}/api/invoices`
      : `${API_BASE_URL}/api/invoices/${finalInvoice.id}`;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedInvoice),
      });
      if (!response.ok) throw new Error("No se pudo guardar la factura.");
      const savedInvoice = await response.json();

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

  const handleSaveCustomer = async (customerPayload: Omit<Customer, "id">) => {
    try {
      const isEditing = Boolean(customerModalState.editingId);
      const customerId = customerModalState.editingId;
      const url = isEditing
        ? `${API_BASE_URL}/api/customers/${customerId}`
        : `${API_BASE_URL}/api/customers`;
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerPayload),
      });
      if (!response.ok) throw new Error("No se pudo guardar el cliente.");
      const savedCustomer = await response.json();

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
        setCurrentInvoice((prev) =>
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

  const navigationItems = [
    { key: "invoices" as const, label: "Facturas" },
    { key: "services" as const, label: "Servicios" },
    { key: "customers" as const, label: "Clientes" },
  ];

  const openCustomerModal = (
    customer: Customer | null = null,
    context: "invoices" | "customers" = "customers"
  ) => {
    setCustomerModalState({
      isOpen: true,
      initialCustomer: customer,
      context,
      editingId: customer?.id ?? null,
    });
  };

  const closeCustomerModal = () => {
    setCustomerModalState({
      isOpen: false,
      initialCustomer: null,
      context: "customers",
      editingId: null,
    });
  };

  const openServiceModal = (
    service: Service | null = null,
    context: "invoices" | "services" = "invoices"
  ) => {
    setServiceModalState({
      isOpen: true,
      initialService: service,
      context,
      editingId: service?.id ?? null,
    });
  };

  const closeServiceModal = () => {
    setServiceModalState({
      isOpen: false,
      initialService: null,
      context: "services",
      editingId: null,
    });
  };

  const sidebar = (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200 shadow-sm">
      <div className="px-6 py-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Panel</h2>
        <p className="text-sm text-gray-500">Gestiona tu negocio</p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveSection(item.key)}
            className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-colors ${
              activeSection === item.key
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="px-6 py-6 border-t border-gray-100 text-xs text-gray-400">
        �(c) {new Date().getFullYear()} Generador de Facturas
      </div>
    </aside>
  );

  const handleSaveService = async (
    serviceInput: Pick<Service, "description" | "price" | "category">
  ) => {
    const isEditing = Boolean(serviceModalState.editingId);
    const targetId = serviceModalState.editingId;
    const endpoint = isEditing && targetId
      ? `${API_BASE_URL}/api/services/${targetId}`
      : `${API_BASE_URL}/api/services`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serviceInput),
      });
      if (!response.ok) {
        const errorResponse = await response.json().catch(() => ({
          error: "No se pudo guardar el servicio o producto.",
        }));
        throw new Error(
          errorResponse.error || "No se pudo guardar el servicio o producto."
        );
      }
      const savedService: Service = await response.json();
      const rawCategory =
        typeof (savedService as any).category === "string"
          ? (savedService as any).category.toLowerCase()
          : "service";
      const rawPrice =
        typeof (savedService as any).price === "string"
          ? parseFloat((savedService as any).price)
          : savedService.price;
      const normalizedService: Service = {
        ...savedService,
        category: rawCategory === "product" ? "product" : "service",
        price: Number.isNaN(rawPrice) ? 0 : rawPrice,
      };
      setServices((prev) => {
        const updatedServices = isEditing
          ? prev.map((service) =>
              service.id === normalizedService.id ? normalizedService : service
            )
          : [...prev, normalizedService];
        return updatedServices.sort((a, b) =>
          a.description.localeCompare(b.description)
        );
      });
      if (serviceModalState.context === "services") {
        setView("list");
        setActiveSection("services");
      }
      closeServiceModal();
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error al guardar el servicio o producto.");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Estas seguro de que deseas eliminar este servicio?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorResponse = await response.json().catch(() => ({}));
        throw new Error(
          errorResponse.error || "No se pudo eliminar el servicio o producto."
        );
      }
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error al eliminar el servicio o producto.");
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm("Estas seguro de que deseas eliminar este cliente?")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorResponse = await response.json().catch(() => ({}));
        throw new Error(
          errorResponse.error || "No se pudo eliminar el cliente."
        );
      }
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== customerId)
      );
      setCurrentInvoice((prev) =>
        prev && prev.customerId === customerId ? { ...prev, customerId: null } : prev
      );
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error al eliminar el cliente.");
    }
  };

  const serviceModal = serviceModalState.isOpen ? (
    <ServiceModal
      onSave={handleSaveService}
      onClose={closeServiceModal}
      initialService={
        serviceModalState.initialService
          ? {
              description: serviceModalState.initialService.description,
              price: serviceModalState.initialService.price,
              category: serviceModalState.initialService.category,
            }
          : null
      }
      title={serviceModalState.editingId ? "Editar servicio" : "Nuevo servicio"}
    />
  ) : null;

  // ... (código anterior)

  const customerModal = customerModalState.isOpen ? (
    <CustomerModal
      onSave={handleSaveCustomer}
      onClose={closeCustomerModal}
      initialCustomer={
        customerModalState.initialCustomer
          ? {
              name: customerModalState.initialCustomer.name,
              email: customerModalState.initialCustomer.email,
              address: customerModalState.initialCustomer.address,
              taxId: customerModalState.initialCustomer.taxId,
            }
          : null
      }
      title={customerModalState.editingId ? "Editar cliente" : "Nuevo cliente"}
    />
  ) : null;

  const handleExportPDF = async () => {
    if (!currentInvoice) return;
    setIsSaving(true);

    try {
      const customer =
        customers.find((candidate) => candidate.id === currentInvoice.customerId) || null;

      const docDefinition = buildInvoicePdfDefinition(currentInvoice, customer);

      await new Promise<void>((resolve) => {
        pdfMake
          .createPdf(docDefinition)
          .download(`Factura-${currentInvoice.invoiceNumber}.pdf`, () => resolve());
      });
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER LOGIC ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Cargando datos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 p-8 text-center">
        {error}
      </div>
    );
  }

  if (view === "editor" && currentInvoice) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex">
        {sidebar}
        <div className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <button
                onClick={() => setView("list")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <BackIcon /> Volver al listado
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSaveInvoice}
                  className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
                >
                  Guardar Factura
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    "Guardando..."
                  ) : (
                    <>
                      <ExportIcon /> Exportar a PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <InvoiceForm
                  invoice={currentInvoice}
                  setInvoice={setCurrentInvoice}
                  customers={customers}
                  services={services}
                  onCreateCustomer={() => openCustomerModal(null, "invoices")}
                  onCreateService={() => openServiceModal(null, "invoices")}
                />
              </div>
              <div>
                <div className="lg:sticky lg:top-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">
                    Vista Previa
                  </h2>
                  <div className="bg-white rounded-xl shadow-lg p-4">
                    <div ref={previewRef}>
                      <InvoicePreview
                        invoice={currentInvoice}
                        customer={
                          customers.find(
                            (c) => c.id === currentInvoice.customerId
                          ) || null
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
          {customerModal}
          {serviceModal}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex">
      {sidebar}

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeSection === "invoices" && "Mis Facturas"}
              {activeSection === "services" && "Servicios"}
              {activeSection === "customers" && "Clientes"}
            </h1>
            {activeSection === "invoices" && (
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
              >
                <AddIcon />
                Crear Factura
              </button>
            )}
          </div>
        </header>
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeSection === "invoices" && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nº Factura
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            No hay facturas guardadas. ¡Crea una!
                          </td>
                        </tr>
                      )}
                      {invoices.map((invoice) => {
                        const customer = customers.find(
                          (c) => c.id === invoice.customerId
                        );
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(invoice.date).toLocaleDateString("es-ES")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              {invoice.total.toLocaleString("es-ES", {
                                style: "currency",
                                currency: "EUR",
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  invoice.status === "Guardada"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                              <button
                                onClick={() => handleEdit(invoice.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDelete(invoice.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <DeleteIcon />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === "services" && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Servicios registrados</h2>
                    <p className="text-sm text-gray-500">
                      Administra los productos y servicios disponibles para tus facturas.
                    </p>
                  </div>
                  <button
                    onClick={() => openServiceModal(null, "services")}
                    className="self-start flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
                  >
                    <AddIcon />
                    Nuevo servicio
                  </button>
                </div>
                <div className="mb-4 max-w-md">
                  <label htmlFor="service-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar servicios
                  </label>
                  <input
                    id="service-search"
                    type="search"
                    value={serviceSearchTerm}
                    onChange={(event) => setServiceSearchTerm(event.target.value)}
                    placeholder="Busca por descripcion, categoria, ID o precio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripcion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {services.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            Aun no hay servicios registrados. Crea el primero.
                          </td>
                        </tr>
                      )}
                      {services.length > 0 && filteredServices.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No se encontraron servicios que coincidan con la busqueda.
                          </td>
                        </tr>
                      )}
                      {filteredServices.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {service.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {service.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                service.category === "product"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {service.category === "product" ? "Producto" : "Servicio"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            {Number(service.price ?? 0).toLocaleString("es-ES", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => openServiceModal(service, "services")}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === "customers" && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Clientes registrados</h2>
                    <p className="text-sm text-gray-500">
                      Gestiona la lista de clientes disponibles para tus facturas.
                    </p>
                  </div>
                  <button
                    onClick={() => openCustomerModal(null, "customers")}
                    className="self-start flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
                  >
                    <AddIcon />
                    Nuevo cliente
                  </button>
                </div>
                <div className="mb-4 max-w-md">
                  <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar clientes
                  </label>
                  <input
                    id="customer-search"
                    type="search"
                    value={customerSearchTerm}
                    onChange={(event) => setCustomerSearchTerm(event.target.value)}
                    placeholder="Busca por nombre, direccion, correo, ID o tax ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Direccion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Correo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tax ID
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            Aun no hay clientes registrados. Crea el primero.
                          </td>
                        </tr>
                      )}
                      {customers.length > 0 && filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            No se encontraron clientes que coincidan con la busqueda.
                          </td>
                        </tr>
                      )}
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {customer.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {customer.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {customer.address || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {customer.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {customer.taxId || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => openCustomerModal(customer, "customers")}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
        {customerModal}
        {serviceModal}
      </div>
    </div>
  );
};

export default App;
