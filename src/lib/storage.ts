import { Bill, Product, Customer, Settings, DEFAULT_SETTINGS } from "./types";

const BILLS_KEY = "billbuddy_bills";
const SETTINGS_KEY = "billbuddy_settings";
const CUSTOMERS_KEY = "billbuddy_customers";

export function getBills(): Bill[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BILLS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveBill(bill: Bill): void {
  const bills = getBills();
  bills.unshift(bill); // newest first
  try {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  } catch (e) {
    console.error("Failed to save bill to localStorage:", e);
    throw e;
  }
}

export function deleteBill(id: string): void {
  const bills = getBills().filter((b) => b.id !== id);
  try {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  } catch (e) {
    console.error("Failed to delete bill from localStorage:", e);
    throw e;
  }
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings to localStorage:", e);
    throw e;
  }
}

const PRODUCTS_KEY = "billbuddy_products";

export function getProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveProduct(product: Product): void {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.unshift(product);
  }
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Failed to save product to localStorage:", e);
    throw e;
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error("Failed to delete product from localStorage:", e);
  }
}

export function getCustomers(): Customer[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === customer.id);
  if (idx >= 0) {
    customers[idx] = customer;
  } else {
    customers.unshift(customer);
  }
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (e) {
    console.error("Failed to save customer to localStorage:", e);
    throw e;
  }
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter((c) => c.id !== id);
  try {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (e) {
    console.error("Failed to delete customer from localStorage:", e);
  }
}

export function findCustomerByPhone(phone: string): Customer | undefined {
  return getCustomers().find((c) => c.phone === phone);
}

const INVOICE_COUNTER_KEY = "billbuddy_invoice_counter";

export function getNextInvoiceNumber(): string {
  if (typeof window === "undefined") return "INV-001";
  const counter = parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || "0", 10);
  return `INV-${String(counter + 1).padStart(3, "0")}`;
}

export function incrementInvoiceCounter(): void {
  if (typeof window === "undefined") return;
  const counter = parseInt(localStorage.getItem(INVOICE_COUNTER_KEY) || "0", 10);
  try {
    localStorage.setItem(INVOICE_COUNTER_KEY, String(counter + 1));
  } catch (e) {
    console.error("Failed to increment invoice counter in localStorage:", e);
  }
}