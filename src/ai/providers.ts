/**
 * [INPUT]: static BYOK provider configuration with no module dependencies
 * [OUTPUT]: exports AiProvider, AiModel, AiProviderConfig, AI_PROVIDERS, getProviderConfig, and getDefaultModel
 * [POS]: canonical AI provider metadata and default-model registry of src/ai/; imported by client.ts, headers.ts, models.ts, errors.ts, and settings UI
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
export type AiProvider = 'openai' | 'openrouter' | 'google' | 'custom'

export interface AiModel {
  id: string
  name: string
  description?: string
  contextLength?: number
}

export interface AiProviderConfig {
  id: AiProvider
  label: string
  shortLabel: string
  description: string
  placeholder: string
  keyUrl: string
  baseUrl: string
  modelsUrl?: string
  defaultModel: string
}

export const AI_PROVIDERS: AiProviderConfig[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    shortLabel: 'OpenAI',
    description: 'Direct BYOK for OpenAI platform keys.',
    placeholder: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
    baseUrl: 'https://api.openai.com/v1',
    modelsUrl: 'https://api.openai.com/v1/models',
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    shortLabel: 'OpenRouter',
    description: 'One key for Claude, GPT, Gemini and open models.',
    placeholder: 'sk-or-…',
    keyUrl: 'https://openrouter.ai/keys',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    defaultModel: 'anthropic/claude-3.5-haiku',
  },
  {
    id: 'google',
    label: 'Google Gemini',
    shortLabel: 'Gemini',
    description: "Direct BYOK using Gemini's OpenAI-compatible endpoint.",
    placeholder: 'AIza…',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/models',
    defaultModel: 'gemini-2.0-flash',
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    shortLabel: 'Custom',
    description: 'Any provider that speaks the OpenAI Chat Completions API.',
    placeholder: 'sk-…',
    keyUrl: '',
    baseUrl: '',
    modelsUrl: undefined,
    defaultModel: '',
  },
]

export function getProviderConfig(provider: AiProvider): AiProviderConfig {
  const config = AI_PROVIDERS.find((p) => p.id === provider)
  if (!config) throw new Error(`Unknown AI provider: ${provider}`)
  return config
}

export function getDefaultModel(provider: AiProvider): string {
  return getProviderConfig(provider).defaultModel
}
