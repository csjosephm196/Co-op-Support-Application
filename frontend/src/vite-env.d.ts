/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Render (or other) API origin only — no path, no trailing slash. Example: https://csa-api.onrender.com */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
