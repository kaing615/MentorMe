/**
 * Format price with localized number formatting
 * @param {number|string} price - The price to format
 * @returns {string} - Formatted price without unnecessary decimals
 */
export const formatPrice = (price) => {
  const numPrice = typeof price === "number" ? price : parseFloat(price || 0);

  // If it's a whole number, show without decimals
  if (numPrice % 1 === 0) {
    return numPrice.toLocaleString("en-US");
  }

  // If it has decimals, show with up to 2 decimal places
  return numPrice.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
};

/**
 * Format price with dollar sign
 * @param {number|string} price - The price to format
 * @returns {string} - Formatted price with $ prefix
 */
export const formatPriceWithCurrency = (price) => {
  return `$${formatPrice(price)}`;
};
