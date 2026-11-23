/**
 * [INPUT]: depends on chat, editImage, AiChatOptions, and AiImageEditOptions from @/ai/client; getPixelDeckConfig from @/config
 * [OUTPUT]: exports AiTransport, transportChat, and transportEditImage
 * [POS]: dependency-inverted AI transport facade of src/ai/; routes feature calls to a host-injected aiTransport or direct browser client.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { chat, editImage } from '@/ai/client'
import type { AiChatOptions, AiImageEditOptions } from '@/ai/client'
import { getPixelDeckConfig } from '@/config'

export interface AiTransport {
  chat(options: AiChatOptions): Promise<string>
  editImage(options: AiImageEditOptions): Promise<string>
}

const directTransport: AiTransport = { chat, editImage }

function resolveTransport(): AiTransport {
  return getPixelDeckConfig().aiTransport ?? directTransport
}

export async function transportChat(options: AiChatOptions): Promise<string> {
  return resolveTransport().chat(options)
}

export async function transportEditImage(options: AiImageEditOptions): Promise<string> {
  return resolveTransport().editImage(options)
}
