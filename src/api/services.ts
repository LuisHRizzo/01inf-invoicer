import { Service } from "../types";

const API_BASE_URL = (process.env.VITE_APP_BACKEND_URL ?? '').replace(/\/+$/, '');

export const getServices = async (): Promise<Service[]> => {
  const response = await fetch(`${API_BASE_URL}/api/data`);
  if (!response.ok) {
    throw new Error(`Error en la red: ${response.statusText}`);
  }
  const data = await response.json();
  const normalizedServices: Service[] = (data.services || [])
    .map((service: Service) => {
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
  return normalizedServices;
};

export const saveService = async (
  serviceInput: Pick<Service, "description" | "price" | "category">,
  serviceId: string | null
): Promise<Service> => {
  const isEditing = Boolean(serviceId);
  const endpoint = isEditing && serviceId
    ? `${API_BASE_URL}/api/services/${serviceId}`
    : `${API_BASE_URL}/api/services`;
  const method = isEditing ? "PUT" : "POST";

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
    typeof savedService.category === "string"
      ? savedService.category.toLowerCase()
      : "service";
  const rawPrice =
    typeof savedService.price === "string"
      ? parseFloat(savedService.price)
      : savedService.price;
  const normalizedService: Service = {
    ...savedService,
    category: rawCategory === "product" ? "product" : "service",
    price: Number.isNaN(rawPrice) ? 0 : rawPrice,
  };
  return normalizedService;
};

export const deleteService = async (serviceId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/services/${serviceId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorResponse = await response.json().catch(() => ({}));
    throw new Error(
      errorResponse.error || "No se pudo eliminar el servicio o producto."
    );
  }
};