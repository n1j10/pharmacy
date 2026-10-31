type Schema<T> = {
  parse(value: unknown): T;
};

type FormRecord = Record<string, unknown>;

const asRecord = (value: unknown): FormRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid form data");
  }
  return value as FormRecord;
};

const text = (value: unknown, label: string, required = true) => {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw new Error(`${label} is required`);
  return result;
};

const number = (value: unknown, label: string, minimum = 0) => {
  const result = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(result) || result < minimum) {
    throw new Error(`${label} must be a number greater than or equal to ${minimum}`);
  }
  return result;
};

const integer = (value: unknown, label: string, minimum = 0) => {
  const result = number(value, label, minimum);
  if (!Number.isInteger(result)) throw new Error(`${label} must be a whole number`);
  return result;
};

const email = (value: unknown) => {
  const result = text(value, "Email").toLowerCase();
  if (result.length > 254 || !/^[^s@]+@[^s@]+.[^s@]+$/.test(result)) {
    throw new Error("Email is invalid");
  }
  return result;
};

// Password policy for new accounts: 8–72 chars (bcrypt only uses the first 72 bytes).
const password = (value: unknown) => {
  const result = typeof value === "string" ? value : "";
  if (result.length < 8 || result.length > 72) {
    throw new Error("Password must be between 8 and 72 characters");
  }
  return result;
};

const schema = <T>(parse: (input: FormRecord) => T): Schema<T> => ({
  parse(value) {
    return parse(asRecord(value));
  },
});

export function validateFuctionSchema<T>(validator: Schema<T>, value: unknown): T {
  return validator.parse(value);
}

export function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Invalid form data");
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error("Invalid form data");
  }
}

export const categorySchema = schema((input) => ({
  name: text(input.name, "Name"),
}));

export const customerSchema = schema((input) => ({
  name: text(input.name, "Name"),
  phone: text(input.phone, "Phone", false),
  notes: text(input.notes, "Notes", false),
}));

export const medicineSchema = schema((input) => ({
  name: text(input.name, "Name"),
  description: text(input.description, "Description", false),
  price: number(input.price, "Price"),
  unit: text(input.unit, "Unit", false),
  manufacturer: text(input.manufacturer, "Manufacturer", false),
  imageUrl: text(input.imageUrl, "Image URL", false),
  categoryId: text(input.categoryId, "Category"),
}));

const batchFields = (input: FormRecord) => ({
  quantity: number(input.quantity, "Quantity", 1),
  expiryDate: (() => {
    const date = new Date(text(input.expiryDate, "Expiry date"));
    if (Number.isNaN(date.getTime())) throw new Error("Expiry date is invalid");
    return date;
  })(),
  costPrice: number(input.costPrice, "Cost price"),
});

export const initialBatchSchema = schema((input) => batchFields(input));
export const batchSchema = schema((input) => ({
  ...batchFields(input),
  medicineId: text(input.medicineId, "Medicine"),
}));
export const batchUpdateSchema = schema((input) => batchFields(input));

export const userSchema = schema((input) => {
  const role = text(input.role, "Role");
  if (role !== "ADMIN" && role !== "SELLER") throw new Error("Role is invalid");
  return {
    name: text(input.name, "Name"),
    email: email(input.email),
    password: password(input.password),
    role,
  };
});
export const registerSchema = schema((input) => ({
  name: text(input.name, "Name"),
  email: email(input.email),
  password: password(input.password),
}));

export const settingsSchema = schema((input) => ({
  pharmacyName: text(input.pharmacyName, "Pharmacy name"),
  phone: text(input.phone, "Phone", false),
  address: text(input.address, "Address", false),
  receiptFooter: text(input.receiptFooter, "Receipt footer", false),
  currency: text(input.currency, "Currency", false),
}));

export const saleSchema = schema((input) => {
  if (!Array.isArray(input.items)) throw new Error("Sale items are invalid");
  const items = input.items.map((value) => {
    const item = asRecord(value);
    return {
      barcode: text(item.barcode, "Barcode"),
      quantity: integer(item.quantity, "Quantity", 1),
    };
  });
  const paymentMethod = text(input.paymentMethod, "Payment method");
  if (paymentMethod !== "CASH" && paymentMethod !== "CARD") {
    throw new Error("Payment method is invalid");
  }
  return {
    items,
    customerId: text(input.customerId, "Customer", false),
    discount: number(input.discount, "Discount"),
    paymentMethod: paymentMethod as PaymentMethod,
  };
});

export const saleReturnSchema = schema((input) => {
  if (!Array.isArray(input.items)) throw new Error("Return items are invalid");
  const items = input.items.map((value) => {
    const item = asRecord(value);
    return {
      saleItemId: text(item.saleItemId, "Sale item"),
      quantity: integer(item.quantity, "Quantity"),
    };
  });
  return { saleId: text(input.saleId, "Sale"), items };
});
import type { PaymentMethod } from "@prisma/client";

