import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { Invoice, Customer, Service } from "../types";
import { useInvoices } from "../hooks/useInvoices";
import { useCustomers } from "../hooks/useCustomers";
import { useServices } from "../hooks/useServices";

interface DataContextType {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  currentInvoice: Invoice | null;
  setCurrentInvoice: React.Dispatch<React.SetStateAction<Invoice | null>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  customerModalState: {
    isOpen: boolean;
    initialCustomer: Customer | null;
    context: "invoices" | "customers";
    editingId: string | null;
  };
  setCustomerModalState: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    initialCustomer: Customer | null;
    context: "invoices" | "customers";
    editingId: string | null;
  }>>;
  serviceModalState: {
    isOpen: boolean;
    initialService: Service | null;
    context: "invoices" | "services";
    editingId: string | null;
  };
  setServiceModalState: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    initialService: Service | null;
    context: "invoices" | "services";
    editingId: string | null;
  }>>;
  serviceSearchTerm: string;
  setServiceSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  customerSearchTerm: string;
  setCustomerSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  error: string | null;
  view: "list" | "editor";
  setView: React.Dispatch<React.SetStateAction<"list" | "editor">>;
  activeSection: "invoices" | "services" | "customers";
  setActiveSection: React.Dispatch<React.SetStateAction<"invoices" | "services" | "customers">>;
  filteredServices: Service[];
  filteredCustomers: Customer[];
  handleCreateNewInvoice: () => void;
  handleEditInvoice: (invoiceId: string) => void;
  handleDeleteInvoice: (invoiceId: string) => void;
  handleSaveInvoice: (invoiceToSave: Invoice) => void;
  handleSaveCustomer: (customerPayload: Omit<Customer, "id">, customerId: string | null) => void;
  handleDeleteCustomer: (customerId: string) => void;
  handleSaveService: (serviceInput: Pick<Service, "description" | "price" | "category">, serviceId: string | null) => void;
  handleDeleteService: (serviceId: string) => void;
  openCustomerModal: (customer?: Customer | null, context?: "invoices" | "customers") => void;
  closeCustomerModal: () => void;
  openServiceModal: (service?: Service | null, context?: "invoices" | "services") => void;
  closeServiceModal: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [view, setView] = useState<"list" | "editor">("list");
  const [activeSection, setActiveSection] = useState<"invoices" | "services" | "customers">("invoices");
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
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const closeCustomerModal = useCallback(() => {
    setCustomerModalState({
      isOpen: false,
      initialCustomer: null,
      context: "customers",
      editingId: null,
    });
  }, []);

  const openCustomerModal = useCallback((
    customer: Customer | null = null,
    context: "invoices" | "customers" = "customers"
  ) => {
    setCustomerModalState({
      isOpen: true,
      initialCustomer: customer,
      context,
      editingId: customer?.id ?? null,
    });
  }, []);

  const closeServiceModal = useCallback(() => {
    setServiceModalState({
      isOpen: false,
      initialService: null,
      context: "services",
      editingId: null,
    });
  }, []);



  const {
    customers,
    setCustomers,
    loading: customersLoading,
    error: customersError,
    handleSaveCustomer,
    handleDeleteCustomer,
  } = useCustomers(setView, setActiveSection, customerModalState, closeCustomerModal, setCurrentInvoice);

  const {
    services,
    setServices,
    loading: servicesLoading,
    error: servicesError,
    serviceSearchTerm,
    setServiceSearchTerm,
    filteredServices,
    handleSaveService,
    handleDeleteService,
    openServiceModal: hookOpenServiceModal, // Renombrar para evitar conflicto
  } = useServices(setView, setActiveSection, serviceModalState, setServiceModalState, closeServiceModal);

  const {
    invoices,
    setInvoices,
    loading: invoicesLoading,
    error: invoicesError,
    handleCreateNewInvoice,
    handleEditInvoice,
    handleDeleteInvoice,
    handleSaveInvoice,
  } = useInvoices(customers, setView, setActiveSection, setCurrentInvoice);

  const loading = useMemo(() => invoicesLoading || customersLoading || servicesLoading, [
    invoicesLoading,
    customersLoading,
    servicesLoading,
  ]);

  const error = useMemo(() => invoicesError || customersError || servicesError, [
    invoicesError,
    customersError,
    servicesError,
  ]);

  const contextValue = {
    invoices,
    setInvoices,
    customers,
    setCustomers,
    services,
    setServices,
    currentInvoice,
    setCurrentInvoice,
    isSaving,
    setIsSaving,
    customerModalState,
    setCustomerModalState,
    serviceModalState,
    setServiceModalState,
    serviceSearchTerm,
    setServiceSearchTerm,
    customerSearchTerm,
    setCustomerSearchTerm,
    loading,
    error,
    view,
    setView,
    activeSection,
    setActiveSection,
    filteredServices,
    filteredCustomers: useMemo(() => {
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
    }, [customers, customerSearchTerm]),
    handleCreateNewInvoice,
    handleEditInvoice,
    handleDeleteInvoice,
    handleSaveInvoice,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleSaveService,
    handleDeleteService,
    openCustomerModal,
    closeCustomerModal,
    openServiceModal: hookOpenServiceModal,
    closeServiceModal,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};