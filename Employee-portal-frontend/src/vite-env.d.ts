/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_ENABLE_ADMIN: string;
  readonly VITE_ENABLE_CHAT: string;
  readonly VITE_ENABLE_DOCUMENT_SEARCH: string;
  readonly VITE_CHAT_MODEL: string;
  readonly VITE_CHAT_MAX_TOKENS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
