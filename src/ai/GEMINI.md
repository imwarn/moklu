# ai/
> L2 | Parent: ../GEMINI.md

Direct browser BYOK AI client layer (OpenAI, OpenRouter, Google Gemini, custom OpenAI-compatible) powering slide-group text translation, screenshot localization, and model discovery.

## Member list
- `client.ts`: Direct browser HTTP client (`chat`, `editImage`, `supportsImageEditing`, `AiClientError`), owning timeouts, retries, CSP diagnostics, and multimodal image extraction.
- `client.test.ts`: Vitest suite verifying chat completion requests, retry/timeout handling, and image editing response extraction.
- `context.ts`: Slide-group design-context builder (`buildDesignContext`, `DesignContext`) summarizing per-slide text roles (`headline`/`subheading`/`body`) and visual inventory for prompts.
- `errors.ts`: Browser network and CORS failure formatter (`formatAiNetworkError`).
- `headers.ts`: OpenAI-compatible authorization and OpenRouter attribution header builder (`buildOpenAiCompatibleHeaders`, `getAiRequestOrigin`).
- `headers.test.ts`: Vitest suite verifying Bearer auth, JSON content-type, and OpenRouter referer/title headers.
- `markedText.ts`: Rich-text `<mN>` tag serializer and parser (`serializeMarkedText`, `parseMarkedText`, `stripMarkTags`) preserving `TextMark` offsets across translation.
- `markedText.test.ts`: Vitest suite verifying tag serialization, offset recomputation, overlap rejection, and malformed-tag fallback.
- `models.ts`: Remote provider model catalog fetcher and search filter (`listModels`, `searchModels`) with static fallback lists for OpenAI and Google.
- `models.test.ts`: Vitest suite verifying model list normalization, deduplication, offline fallback, and query filtering.
- `prompts.ts`: Single source of truth for single/batch translation and image localization system/user/retry prompts (`TRANSLATION_SYSTEM_PROMPT`, `buildSingleTranslationPrompt`, `buildSingleTranslationRetryPrompt`, `buildBatchTranslationPrompt`, `buildBatchTranslationRetryPrompt`, `IMAGE_LOCALIZATION_SYSTEM_PROMPT`, `buildImageLocalizationPrompt`).
- `providers.ts`: Canonical BYOK provider metadata and default-model registry (`AI_PROVIDERS`, `getProviderConfig`, `getDefaultModel`, `AiProvider`, `AiModel`, `AiProviderConfig`).
- `transport.ts`: Dependency-inverted transport facade (`AiTransport`, `transportChat`, `transportEditImage`) delegating to host-injected `aiTransport` or `client.ts`.
- `transport.test.ts`: Vitest suite verifying host `aiTransport` override resolution and fallback to direct browser transport.
- `features/`: High-level AI feature workflows (`translateText.ts`, `localizeImage.ts`, `testConnection.ts`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
