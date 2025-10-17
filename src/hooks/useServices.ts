import { useState, useEffect, useMemo } from "react";
import { Service } from "../types";
import { getServices, saveService, deleteService } from "../api/services";

export const useServices = (
  setView: (view: "list" | "editor") => void,
  setActiveSection: (section: "invoices" | "services" | "customers") => void,
  serviceModalState: {
    isOpen: boolean;
    initialService: Service | null;
    context: "invoices" | "services";
    editingId: string | null;
  },
  setServiceModalState: (state: {
    isOpen: boolean;
    initialService: Service | null;
    context: "invoices" | "services";
    editingId: string | null;
  }) => void,
  closeServiceModal: () => void
) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await getServices();
        setServices(servicesData);
      } catch (e: unknown) {
        let errorMessage = "No se pudieron cargar los servicios.";
        if (e instanceof Error) {
          errorMessage = `No se pudieron cargar los servicios. (${e.message})`;
        }
        setError(errorMessage);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

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

  const handleSaveService = async (
    serviceInput: Pick<Service, "description" | "price" | "category">,
    serviceId: string | null
  ) => {
    try {
      const normalizedService = await saveService(serviceInput, serviceId);
      
      setServices((prev) => {
        const updatedServices = serviceId
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
    } catch (e: unknown) {
      console.error(e);
      let errorMessage = "Error al guardar el servicio o producto.";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      alert(errorMessage);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Estas seguro de que deseas eliminar este servicio?")) {
      return;
    }
    try {
      await deleteService(serviceId);
      setServices((prev) => prev.filter((service) => service.id !== serviceId));
    } catch (e: unknown) {
      console.error(e);
      let errorMessage = "Error al eliminar el servicio o producto.";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      alert(errorMessage);
    }
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

  return {
    services,
    setServices,
    loading,
    error,
    serviceSearchTerm,
    setServiceSearchTerm,
    filteredServices,
    handleSaveService,
    handleDeleteService,
    openServiceModal,
  };
};