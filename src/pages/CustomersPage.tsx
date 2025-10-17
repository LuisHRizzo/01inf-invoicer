import React from "react";
import { useData } from "../context/DataContext";
import { AddIcon, EditIcon, DeleteIcon } from "../../components/Icons";

const CustomersPage: React.FC = () => {
  const {
    customers,
    customerSearchTerm,
    setCustomerSearchTerm,
    filteredCustomers,
    handleDeleteCustomer,
    openCustomerModal,
    activeSection,
  } = useData();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Clientes registrados</h2>
          <p className="text-sm text-gray-500">
            Gestiona la lista de clientes disponibles para tus facturas.
          </p>
        </div>
        {activeSection === "customers" && (
          <button
            onClick={() => openCustomerModal(null, "customers")}
            className="self-start flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
          >
            <AddIcon />
            Nuevo cliente
          </button>
        )}
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
  );
};

export default CustomersPage;