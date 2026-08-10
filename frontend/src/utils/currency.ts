export const formatVnd = (amount?: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })
    .format(typeof amount === "number" ? amount : 0)
    .replace(/\s/g, " ");

export const parseVndPriceRange = (
  value: string,
): { min?: number; max?: number } => {
  if (!value) return {};
  if (value === "free") return { max: 0 };
  if (value.endsWith("+")) {
    const min = Number(value.slice(0, -1));
    return Number.isFinite(min) ? { min } : {};
  }
  const [min, max] = value.split("-").map(Number);
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : {};
};
