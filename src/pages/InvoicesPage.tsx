import React from "react";
import { useData } from "../context/DataContext";
import { AddIcon, EditIcon, DeleteIcon } from "../../components/Icons";

const InvoicesPage: React.FC = () => {
  const {
    invoices,
    customers,
    handleCreateNewInvoice,
    handleEditInvoice,
    handleDeleteInvoice,
    activeSection,
  } = useData();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Mis Facturas</h2>
          <p className="text-sm text-gray-500">
            Administra todas las facturas de tu negocio.
          </p>
        </div>
        {activeSection === "invoices" && (
          <button
            onClick={handleCreateNewInvoice}
            className="self-start flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
          >
            <AddIcon />
            Crear Factura
          </button>
        )}
      </div>
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
                      onClick={() => handleEditInvoice(invoice.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
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
  );
};

export default InvoicesPage;