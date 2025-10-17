import { Customer } from "../types";

const API_BASE_URL = (process.env.VITE_APP_BACKEND_URL ?? '').replace(/\/+$/, '');

export const getCustomers = async (): Promise<Customer[]> => {
  const response = await fetch(`${API_BASE_URL}/api/data`);
  if (!response.ok) {
    throw new Error(`Error en la red: ${response.statusText}`);
  }
  const data = await response.json();
  return data.customers;
};

export const saveCustomer = async (
  customerPayload: Omit<Customer, "id">,
  customerId: string | null
): Promise<Customer> => {
  const isEditing = Boolean(customerId);
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
  return response.json();
};

export const deleteCustomer = async (customerId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/customers/${customerId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorResponse = await response.json().catch(() => ({}));
    throw new Error(
      errorResponse.error || "No se pudo eliminar el cliente."
    );
  }
};