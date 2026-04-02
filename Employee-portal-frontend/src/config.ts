// Environment configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT
  ? parseInt(import.meta.env.VITE_API_TIMEOUT)
  : 30000;

// Feature flags
export const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN === "true";
export const ENABLE_CHAT = import.meta.env.VITE_ENABLE_CHAT === "true";
export const ENABLE_DOCUMENT_SEARCH =
  import.meta.env.VITE_ENABLE_DOCUMENT_SEARCH === "true";

// AI Configuration
export const CHAT_MODEL = import.meta.env.VITE_CHAT_MODEL || "gpt-4";
export const CHAT_MAX_TOKENS = import.meta.env.VITE_CHAT_MAX_TOKENS
  ? parseInt(import.meta.env.VITE_CHAT_MAX_TOKENS)
  : 2000;
