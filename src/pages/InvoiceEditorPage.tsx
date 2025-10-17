import React, { useRef } from "react";
import { useData } from "../context/DataContext";
import InvoiceForm from "../../components/InvoiceForm";
import InvoicePreview from "../../components/InvoicePreview";
import CustomerModal from "../../components/CustomerModal";
import ServiceModal from "../../components/ServiceModal";
import {
  ExportIcon,
  BackIcon,
} from "../../components/Icons";


import { useInvoicePdf } from "../hooks/useInvoicePdf"; // Importar el nuevo hook


const InvoiceEditorPage: React.FC = () => {
  const {
    setView,
    currentInvoice,
    setCurrentInvoice,
    customers,
    services,
    openCustomerModal,
    openServiceModal,
    handleSaveInvoice,
    customerModalState,
    closeCustomerModal,
    serviceModalState,
    closeServiceModal,
    handleSaveCustomer,
    handleSaveService,
  } = useData();

  const { isGeneratingPdf, exportInvoiceToPdf } = useInvoicePdf();

  const previewRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!currentInvoice) return;
    await exportInvoiceToPdf(currentInvoice, customers.find((c) => c.id === currentInvoice.customerId) || null);
  };

  if (!currentInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 p-8 text-center">
        No se ha seleccionado ninguna factura para editar.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex">
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
                onClick={() => handleSaveInvoice(currentInvoice)}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors"
              >
                Guardar Factura
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  "Generando PDF..."
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
        {customerModalState.isOpen && (
          <CustomerModal
            onSave={(customerPayload) => handleSaveCustomer(customerPayload, customerModalState.editingId)}
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
        )}
        {serviceModalState.isOpen && (
          <ServiceModal
            onSave={(serviceInput) => handleSaveService(serviceInput, serviceModalState.editingId)}
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
        )}
      </div>
    </div>
  );
};

export default InvoiceEditorPage;