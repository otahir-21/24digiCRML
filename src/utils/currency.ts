/**
 * Currency formatting utilities
 */

// Currency configuration
export const CURRENCY = {
  code: 'AED',
  symbol: 'AED',
  locale: 'en-AE',
  decimals: 2,
}

/**
 * Format a number as currency (AED)
 * @param amount - The amount to format
 * @param includeDecimals - Whether to include decimal places (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, includeDecimals: boolean = true): string => {
  // Handle undefined, null, or NaN values
  const safeAmount = (amount === undefined || amount === null || isNaN(amount)) ? 0 : amount;
  const formatted = includeDecimals ? safeAmount.toFixed(CURRENCY.decimals) : Math.round(safeAmount).toString()
  return `${CURRENCY.symbol} ${formatted}`
}

/**
 * Format a price with currency symbol
 * @param price - The price to format
 * @returns Formatted price string
 */
export const formatPrice = (price: number): string => {
  // Additional safety check before passing to formatCurrency
  const safePrice = (price === undefined || price === null || isNaN(price)) ? 0 : price;
  return formatCurrency(safePrice, true)
}

/**
 * Parse a currency string back to number
 * @param currencyString - The currency string to parse
 * @returns The numeric value
 */
export const parseCurrency = (currencyString: string): number => {
  // Remove currency symbol and any non-numeric characters except decimal point
  const cleanString = currencyString.replace(/[^0-9.-]/g, '')
  return parseFloat(cleanString) || 0
}

/**
 * Get currency label for forms
 * @returns Currency label string
 */
export const getCurrencyLabel = (): string => {
  return `Price (${CURRENCY.symbol})`
}

/**
 * Get currency symbol
 * @returns Currency symbol
 */
export const getCurrencySymbol = (): string => {
  return CURRENCY.symbol
}