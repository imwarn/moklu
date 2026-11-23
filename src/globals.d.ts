/**
 * [INPUT]: ambient compile-time declarations matching vite.config.ts define entries
 * [OUTPUT]: declares global constants __APP_VERSION__ and __GIT_HASH__
 * [POS]: global Vite build-constant type declaration of src/
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
// Build-time constants injected by vite.config.ts → define
declare const __APP_VERSION__: string
declare const __GIT_HASH__: string
