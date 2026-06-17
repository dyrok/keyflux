/// <reference types="vite/client" />

// Self-hosted font packages ship CSS only (no type declarations) — declare the
// side-effect imports so TypeScript accepts them.
declare module '@fontsource-variable/inter'
declare module '@fontsource-variable/jetbrains-mono'
