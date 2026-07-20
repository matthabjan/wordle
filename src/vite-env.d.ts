/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_GAME_NAME: string
  readonly VITE_GAME_DESCRIPTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
