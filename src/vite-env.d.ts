/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Injected from package.json by `define` in vite.config.ts
declare const __APP_VERSION__: string

interface ImportMetaEnv {
  readonly VITE_GAME_NAME: string
  readonly VITE_GAME_DESCRIPTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
