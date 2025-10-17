const sanitizeNumber = (value: number | string | null | undefined): number => {
  const numeric = typeof value === "string" ? Number(value) : value ?? 0;
  return Number.isFinite(numeric) ? Number(numeric) : 0;
};

const formatQuantity = (value: number): string => {
  const numeric = sanitizeNumber(value);
  if (Number.isInteger(numeric)) {
    return numeric.toString();
  }
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value: number): string =>
  sanitizeNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatPercentage = (value: number): string =>
  sanitizeNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const normalizeDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split("/");
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string | Date | null | undefined): string => {
  const date = normalizeDate(value);
  if (!date) return "";
  const local = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  const day = String(local.getDate()).padStart(2, "0");
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const year = local.getFullYear();
  return `${day}/${month}/${year}`;
};

export {
  sanitizeNumber,
  formatQuantity,
  formatCurrency,
  formatPercentage,
  formatDate,
};