/**
 * Service validation constants
 * These constants define the limits for service creation and updates
 */

export const SERVICE_LIMITS = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  DURATION: {
    MIN_MINUTES: 15,
    MAX_MINUTES: 300,
  },
  PRICE: {
    MIN: 1000,
    MAX: 10_000_000,
  },
} as const;

export const SERVICE_VALIDATION_MESSAGES = {
  NAME_REQUIRED: "Xizmat nomi majburiy",
  NAME_TOO_LONG: "Xizmat nomi juda uzun (maksimum 100 belgi)",
  DESCRIPTION_TOO_LONG: "Tavsif juda uzun (maksimum 500 belgi)",
  DURATION_INVALID: "Davomiylik 15 dan 300 daqiqa oralig'ida bo'lishi kerak",
  DURATION_INTEGER: "Davomiylik butun son bo'lishi kerak",
  PRICE_POSITIVE: "Narx musbat son bo'lishi kerak",
  PRICE_MIN: "Narx kamida 1000 so'm bo'lishi kerak",
  PRICE_MAX: "Narx ko'pi bilan 10,000,000 so'm bo'lishi kerak",
} as const;
