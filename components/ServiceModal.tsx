import React, { useEffect, useState } from "react";
import type { ServiceCategory } from "../types";

interface ServiceModalProps {
  onSave: (service: {
    description: string;
    price: number;
    category: ServiceCategory;
  }) => void;
  onClose: () => void;
  initialService?: {
    description: string;
    price: number;
    category: ServiceCategory;
  } | null;
  title?: string;
}

const ServiceModal: React.FC<ServiceModalProps> = ({
  onSave,
  onClose,
  initialService = null,
  title,
}) => {
  const [service, setService] = useState<{
    description: string;
    price: string;
    category: ServiceCategory;
  }>({
    description: "",
    price: "",
    category: "service",
  });

  useEffect(() => {
    if (initialService) {
      setService({
        description: initialService.description ?? "",
        price: initialService.price.toString(),
        category: initialService.category ?? "service",
      });
    } else {
      setService({
        description: "",
        price: "",
        category: "service",
      });
    }
  }, [initialService]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setService((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedPrice = parseFloat(service.price);
    if (!service.description.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return;
    }
    onSave({
      description: service.description.trim(),
      price: parsedPrice,
      category: service.category,
    });
  };

  const modalTitle =
    title ?? (initialService ? "Editar servicio" : "Anadir producto o servicio");

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-8 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{modalTitle}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Nombre / descripcion
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={service.description}
              onChange={handleChange}
              required
              className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              Precio unitario
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={service.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Tipo
            </label>
            <select
              id="category"
              name="category"
              value={service.category}
              onChange={handleChange}
              className="bg-white mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="service">Servicio</option>
              <option value="product">Producto</option>
            </select>
          </div>
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
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;
