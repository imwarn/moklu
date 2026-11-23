# features/
> L2 | Parent: ../GEMINI.md

High-level AI localization and connectivity workflows composed over `src/ai/transport.ts`, `src/ai/context.ts`, `src/ai/prompts.ts`, and `src/ai/markedText.ts`.

## Member list
- `translateText.ts`: Single-layer and batch slide-group text translation (`translateLayerText`, `translateGroupTexts`, `parseSingleTranslationResponse`, `parseBatchTranslationResponse`, `AiAuth`, `TranslationResult`, `BatchTranslationItem`) with JSON repair, retry loop, and rich-text mark round-tripping.
- `translateText.test.ts`: Vitest suite verifying single/batch translation prompt construction, JSON parsing, control-char repair, and mark preservation.
- `translateText.retry.test.ts`: Vitest suite verifying malformed-JSON retry flows and failure diagnostics for single and batch translation.
- `localizeImage.ts`: Context-aware screenshot/image localization workflow (`generateLocalizedImage`) dispatching image-editing prompts through `transportEditImage`.
- `testConnection.ts`: End-to-end provider/model connectivity probe (`testAiConnection`) exercising the live chat completion path with retries disabled.

[PROTOCOL]: Update this header on change, then check GEMINI.md
