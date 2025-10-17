import React from "react";
import { useData } from "../context/DataContext";
import { AddIcon, EditIcon, DeleteIcon } from "../../components/Icons";

const ServicesPage: React.FC = () => {
  const {
    services,
    serviceSearchTerm,
    setServiceSearchTerm,
    filteredServices,
    handleDeleteService,
    openServiceModal,
    activeSection,
  } = useData();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Servicios registrados</h2>
          <p className="text-sm text-gray-500">
            Administra los productos y servicios disponibles para tus facturas.
          </p>
        </div>
        {activeSection === "services" && (
          <button
            onClick={() => openServiceModal(null, "services")}
            className="self-start flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
          >
            <AddIcon />
            Nuevo servicio
          </button>
        )}
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
  );
};

export default ServicesPage;