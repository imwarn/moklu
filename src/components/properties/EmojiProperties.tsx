/**
 * [INPUT]: depends on useEditorStore, SliderField, panelConstants, and useStudioLocale from @/i18n
 * [OUTPUT]: exports EmojiProperties inspector panel localized across EN/ZH/JA/KO
 * [POS]: emoji layer property editor within src/components/properties
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { useEditorStore } from '@/store'
import type { EmojiLayer, Layer } from '@/types'
import { SliderField } from '@/components/properties/PropertyControls'
import { labelCls, panelSectionCls, pauseTemporal, resumeTemporal } from '@/components/properties/panelConstants'
import { useStudioLocale, type StudioDictionary } from '@/i18n'

type EmojiCategoryKey = keyof StudioDictionary['properties']['emojiCategories']

// Common emoji categories for quick picking
const EMOJI_CATEGORIES: ReadonlyArray<{ key: EmojiCategoryKey; emojis: readonly string[] }> = [
  { key: 'smileys', emojis: ['😀','😂','🥹','😍','🤩','😎','🥳','🤔','😴','🤯','🥺','😭','😤','🤗','😇','🫡'] },
  { key: 'gestures', emojis: ['👍','👎','👏','🙌','🤝','✌️','🤞','🫶','❤️','🔥','⭐','✨','💫','🎉','🎊','🏆'] },
  { key: 'nature', emojis: ['🌟','🌈','☀️','🌙','⚡','❄️','🌊','🍀','🌸','🌺','🦋','🐝','🦄','🐉','🌴','🍁'] },
  { key: 'objects', emojis: ['🚀','💡','🎯','🔑','💎','🎨','📱','💻','🎵','🎮','📸','🔮','⚙️','🛡️','⚔️','🏹'] },
  { key: 'food', emojis: ['🍕','🍔','🍣','🍜','🍦','🍩','☕','🧃','🍺','🥂','🍓','🥑','🌮','🍿','🧁','🍰'] },
  { key: 'symbols', emojis: ['✅','❌','⚠️','💯','🔴','🟢','🔵','🟡','⬆️','➡️','🔄','♾️','🆕','🆓','💬','📣'] },
]

export function EmojiProperties({ layer }: { layer: EmojiLayer }) {
  const { t } = useStudioLocale()
  const tp = t.properties
  const updateLayer = useEditorStore((s) => s.updateLayer)
  const upd = (patch: Partial<EmojiLayer>) => updateLayer(layer.id, patch as Partial<Layer>)

  return (
    <div className="space-y-4">
      <div className={panelSectionCls}>
        <label className={labelCls}>{tp.emoji}</label>
        <input
          type="text"
          value={layer.emoji}
          onChange={(e) => upd({ emoji: e.target.value })}
          className="w-full rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-2xl text-center text-[#e8e8f0] outline-none focus:border-[#7c6ef6] transition-colors"
          placeholder={tp.emojiPlaceholder}
          maxLength={8}
        />
      </div>

      <div className={panelSectionCls}>
        <SliderField
          label={tp.size}
          value={layer.fontSize}
          min={10}
          max={500}
          unit="px"
          onChange={(v) => upd({ fontSize: v })}
          onInteractionStart={pauseTemporal}
          onInteractionEnd={resumeTemporal}
          className="!mb-0"
        />
      </div>

      {EMOJI_CATEGORIES.map((cat) => (
        <div key={cat.key} className={panelSectionCls}>
          <label className={labelCls}>{tp.emojiCategories[cat.key]}</label>
          <div className="grid grid-cols-8 gap-1">
            {cat.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => upd({ emoji })}
                title={emoji}
                className={`flex items-center justify-center w-full aspect-square text-xl rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.1)] ${layer.emoji === emoji ? 'bg-[rgba(124,110,246,0.2)] ring-1 ring-[#7c6ef6]' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
