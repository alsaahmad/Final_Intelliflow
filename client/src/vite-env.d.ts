/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPPLS_API_KEY?: string;
  readonly VITE_FASTAPI_BASE_URL?: string;
  readonly VITE_FASTAPI_GIS_URL?: string;
  readonly VITE_FASTAPI_NAVIGATION_URL?: string;
  readonly VITE_FASTAPI_SIMULATION_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

