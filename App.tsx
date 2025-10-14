import React, { useState, useEffect, useRef } from "react";
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

declare const jspdf: any;
declare const html2canvas: any;

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');


const App: React.FC = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState<"list" | "editor">("list");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          `No se pudieron cargar los datos. Asegúrate de que el servidor backend esté en ejecución. (${e.message})`
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
    setView("editor");
  };

  const handleEdit = (invoiceId: string) => {
    const invoiceToEdit = invoices.find((inv) => inv.id === invoiceId);
    if (invoiceToEdit) {
      setCurrentInvoice(invoiceToEdit);
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

  const handleSaveCustomer = async (newCustomer: Omit<Customer, "id">) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      });
      if (!response.ok) throw new Error("No se pudo guardar el cliente.");
      const savedCustomer = await response.json();
      setCustomers((prev) => [...prev, savedCustomer]);
      setCurrentInvoice((prev) =>
        prev ? { ...prev, customerId: savedCustomer.id } : null
      );
      setIsCustomerModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Error al guardar el cliente.");
    }
  };

  const handleSaveService = async (newService: Omit<Service, "id">) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newService),
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
      setServices((prev) =>
        [...prev, normalizedService].sort((a, b) =>
          a.description.localeCompare(b.description)
        )
      );
      setIsServiceModalOpen(false);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Error al guardar el servicio o producto.");
    }
  };

  // ... (código anterior)

  const handleExportPDF = async () => {
    if (!previewRef.current || !currentInvoice) return;
    setIsSaving(true);

    // ----------------------------------------------------
    // PASO 1: MANIPULACIÓN DEL DOM (SOLUCIÓN AL CORTE)
    // ----------------------------------------------------
    const previewElement = previewRef.current;
    const container = previewElement.parentElement as HTMLElement | null;
    const stickyWrapper = container?.parentElement as HTMLElement | null;

    const originalContainerClass = container?.className ?? "";
    const originalContainerMaxHeight = container?.style.maxHeight ?? "";
    const originalContainerOverflow = container?.style.overflow ?? "";
    const originalStickyClass = stickyWrapper?.className ?? "";

    if (container) {
      container.style.maxHeight = "none";
      container.style.overflow = "visible";
    }

    if (stickyWrapper) {
      stickyWrapper.className = stickyWrapper.className
        .replace("sticky top-8", "")
        .trim();
    }

    try {
      // 2. Capturar el contenido HTML a un Canvas
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff", // Aseguramos que la captura empieza desde arriba, ignorando el scroll de la ventana
        scrollY: -window.scrollY,
      }); // ----------------------------------------------------

      // 3. OPTIMIZACIÓN (SOLUCIÓN A LOS 21 MB)
      // Usamos JPEG con calidad 0.9 (90%) en lugar de PNG.
      // ----------------------------------------------------
      const imgData = canvas.toDataURL("image/jpeg", 0.9);

      const { jsPDF } = jspdf;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgCanvasWidth = canvas.width;
      const imgCanvasHeight = canvas.height;

      const margin = 12;
      const printableWidth = pdfWidth - margin * 2;
      const printableHeight = pdfHeight - margin * 2;

      const scale = Math.min(
        printableWidth / imgCanvasWidth,
        printableHeight / imgCanvasHeight,
        1
      );

      const imgWidth = imgCanvasWidth * scale;
      const imgHeight = imgCanvasHeight * scale;

      const offsetX = (pdfWidth - imgWidth) / 2;
      const offsetY = Math.max(margin, (pdfHeight - imgHeight) / 2);

      pdf.addImage(imgData, "JPEG", offsetX, offsetY, imgWidth, imgHeight);

      pdf.save(`Factura-${currentInvoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    } finally {
      // ----------------------------------------------------
      // PASO 6: RESTAURAR EL DOM
      // ----------------------------------------------------
      if (container) {
        container.className = originalContainerClass;
        container.style.maxHeight = originalContainerMaxHeight;
        container.style.overflow = originalContainerOverflow;
      }
      if (stickyWrapper) {
        stickyWrapper.className = originalStickyClass;
      }
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
      <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
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
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <InvoiceForm
              invoice={currentInvoice}
              setInvoice={setCurrentInvoice}
              customers={customers}
              services={services}
              onCreateCustomer={() => setIsCustomerModalOpen(true)}
              onCreateService={() => setIsServiceModalOpen(true)}
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
        </main>
        {isCustomerModalOpen && (
          <CustomerModal
            onSave={handleSaveCustomer}
            onClose={() => setIsCustomerModalOpen(false)}
          />
        )}
        {isServiceModalOpen && (
          <ServiceModal
            onSave={handleSaveService}
            onClose={() => setIsServiceModalOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
          >
            <AddIcon />
            Crear Factura
          </button>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                          className="text-red-600 hover:red-900"
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
      </main>
    </div>
  );
};

export default App;
