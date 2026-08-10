export const formatVnd = (amount?: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  })
    .format(typeof amount === "number" ? amount : 0)
    .replace(/\s/g, " ");
