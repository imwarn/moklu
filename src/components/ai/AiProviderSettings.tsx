/**
 * [INPUT]: depends on react hooks/Fragment, testAiConnection, listModels/searchModels, AI_PROVIDERS/getDefaultModel, useApiKeysStore, and useStudioLocale/formatMessage/splitMessageTemplate from @/i18n
 * [OUTPUT]: exports AiProviderSettings provider/key/model selector UI localized across EN/ZH/JA/KO
 * [POS]: shared AI configuration panel mounted inside SettingsModal and ApiKeysModal within src/components/ai
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */
import { Fragment, useEffect, useMemo, useState } from 'react'
import { testAiConnection } from '@/ai/features/testConnection'
import { listModels, searchModels } from '@/ai/models'
import { AI_PROVIDERS, getDefaultModel } from '@/ai/providers'
import { useApiKeysStore } from '@/store/apiKeys'
import type { AiModel, AiProvider } from '@/ai/providers'
import { formatMessage, splitMessageTemplate, useStudioLocale } from '@/i18n'

const inputCls =
  'bg-surface border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-sm text-[#e8e8f0] w-full focus:outline-none focus:border-accent/60'
const monoInputCls = `${inputCls} font-mono`
const labelCls = 'text-[11px] text-[#6b6b7a] mb-1 block uppercase tracking-[0.08em]'

export function AiProviderSettings() {
  const { t } = useStudioLocale()
  const ta = t.modals.aiProvider
  const {
    provider,
    openaiKey,
    openrouterKey,
    googleKey,
    customBaseUrl,
    customApiKey,
    selectedModels,
    setProvider,
    setOpenaiKey,
    setOpenrouterKey,
    setGoogleKey,
    setCustomBaseUrl,
    setCustomApiKey,
    setModel,
  } = useApiKeysStore()
  const [models, setModels] = useState<AiModel[]>([])
  const [modelSearch, setModelSearch] = useState('')
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [modelResultSignature, setModelResultSignature] = useState('')
  const [modelLoadNonce, setModelLoadNonce] = useState(0)
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testSignature, setTestSignature] = useState('')

  function keyValue(p: AiProvider) {
    if (p === 'openai') return openaiKey
    if (p === 'openrouter') return openrouterKey
    if (p === 'google') return googleKey
    return customApiKey
  }

  function setKey(p: AiProvider, value: string) {
    if (p === 'openai') setOpenaiKey(value)
    else if (p === 'openrouter') setOpenrouterKey(value)
    else if (p === 'google') setGoogleKey(value)
    else setCustomApiKey(value)
  }

  function providerShortLabel(item: (typeof AI_PROVIDERS)[number]): string {
    return item.id === 'custom' ? ta.providers.customShortLabel : item.shortLabel
  }

  function providerFullLabel(item: (typeof AI_PROVIDERS)[number]): string {
    return item.id === 'custom' ? ta.providers.customLabel : item.label
  }

  function providerDescription(item: (typeof AI_PROVIDERS)[number]): string {
    if (item.id === 'openai') return ta.providers.openaiDesc
    if (item.id === 'openrouter') return ta.providers.openrouterDesc
    if (item.id === 'google') return ta.providers.googleDesc
    return ta.providers.customDesc
  }

  const activeProvider = AI_PROVIDERS.find((item) => item.id === provider) ?? AI_PROVIDERS[0]
  const activeProviderLabel = providerFullLabel(activeProvider)
  const activeKey = keyValue(provider)
  const hasActiveKey = activeKey.trim().length > 0 && (provider !== 'custom' || customBaseUrl.trim().length > 0)
  const modelSignature = `${provider}:${activeKey.trim()}:${provider === 'custom' ? customBaseUrl.trim() : ''}`
  const isCurrentModelResult = hasActiveKey && modelResultSignature === modelSignature
  const visibleModels = useMemo(
    () => (isCurrentModelResult && !modelError ? models : []),
    [isCurrentModelResult, modelError, models],
  )
  const activeModelError = isCurrentModelResult ? modelError : null
  const activeModel = selectedModels[provider] || getDefaultModel(provider)
  const filteredModels = useMemo(
    () => searchModels(visibleModels, modelSearch).slice(0, 80),
    [visibleModels, modelSearch],
  )
  const modelStatus = !hasActiveKey
    ? ta.statusNotConnected
    : loadingModels || !isCurrentModelResult
      ? ta.statusConnecting
      : activeModelError
        ? ta.statusFailed
        : formatMessage(ta.statusModelCount, { count: visibleModels.length })
  const isCurrentTestResult = hasActiveKey && testSignature === modelSignature
  const visibleTestState = isCurrentTestResult ? testState : 'idle'

  async function runConnectionTest() {
    const auth = {
      provider,
      apiKey: activeKey,
      model: activeModel,
      baseUrl: provider === 'custom' ? customBaseUrl.trim() : undefined,
    }
    setTestState('testing')
    setTestError(null)
    setTestResult(null)
    setTestSignature(modelSignature)
    try {
      const translated = await testAiConnection(auth)
      setTestResult(translated)
      setTestState('success')
    } catch (error) {
      setTestError(error instanceof Error ? error.message : ta.unknownError)
      setTestState('error')
    }
  }

  useEffect(() => {
    let cancelled = false
    if (!hasActiveKey) return () => { cancelled = true }

    async function loadProviderModels() {
      setLoadingModels(true)
      setModelError(null)
      try {
        const nextModels = await listModels(provider, activeKey, provider === 'custom' ? customBaseUrl.trim() : undefined)
        if (cancelled) return
        setModels(nextModels)
        setModelResultSignature(modelSignature)
      } catch (error) {
        if (cancelled) return
        setModels([])
        setModelError(error instanceof Error ? error.message : ta.unknownError)
        setModelResultSignature(modelSignature)
      } finally {
        if (!cancelled) setLoadingModels(false)
      }
    }

    const timeout = window.setTimeout(() => void loadProviderModels(), 500)
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [activeKey, customBaseUrl, hasActiveKey, modelLoadNonce, modelSignature, provider, ta.unknownError])

  return (
    <div>
      <div className="mb-4">
        <label className={labelCls}>{ta.providerLabel}</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {AI_PROVIDERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setProvider(item.id)
                setModelSearch('')
              }}
              className={`rounded-lg border px-2 py-2 text-xs transition-colors text-left ${
                provider === item.id
                  ? 'border-accent bg-accent-soft text-accent-text'
                  : 'border-[rgba(255,255,255,0.1)] text-muted hover:text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <span className="block font-medium">{providerShortLabel(item)}</span>
              <span className="block mt-1 text-[10px] opacity-70 leading-tight">{providerDescription(item)}</span>
            </button>
          ))}
        </div>
      </div>

      {provider === 'custom' && (
        <div className="mb-4">
          <label className={labelCls}>{ta.baseUrlLabel}</label>
          <input
            type="text"
            value={customBaseUrl}
            onChange={(event) => setCustomBaseUrl(event.target.value)}
            placeholder="https://api.example.com/v1"
            className={monoInputCls}
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-[#4a4a5a] leading-relaxed">
            {ta.baseUrlHint}
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className={labelCls}>{formatMessage(ta.apiKeyLabel, { provider: activeProviderLabel })}</label>
        <input
          type="password"
          value={activeKey}
          onChange={(event) => setKey(provider, event.target.value)}
          placeholder={activeProvider.placeholder}
          className={monoInputCls}
          autoComplete="off"
        />
        {activeProvider.keyUrl && (
          <p className="mt-1 text-[11px] text-[#4a4a5a] leading-relaxed">
            {splitMessageTemplate(ta.getKeyFrom).map((part, idx) => (
              <Fragment key={idx}>
                {part.type === 'token' && part.key === 'link' ? (
                  <a href={activeProvider.keyUrl} target="_blank" rel="noreferrer" className="text-accent-text hover:underline">
                    {activeProvider.keyUrl.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  part.type === 'text' ? part.value : ''
                )}
              </Fragment>
            ))}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className={labelCls}>{ta.testConnection}</label>
        <button
          type="button"
          onClick={() => void runConnectionTest()}
          disabled={!hasActiveKey || visibleTestState === 'testing'}
          className="rounded-md border border-[rgba(255,255,255,0.12)] px-3 py-1.5 text-xs text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {visibleTestState === 'testing' ? ta.testing : ta.testConnection}
        </button>
        {visibleTestState === 'success' && (
          <div className="mt-2 rounded-lg border border-[rgba(74,222,128,0.25)] bg-[rgba(74,222,128,0.08)] px-3 py-3">
            <p className="text-xs text-[#86efac] leading-relaxed">
              {formatMessage(ta.connectionWorks, { result: testResult ?? '' })}
            </p>
          </div>
        )}
        {visibleTestState === 'error' && (
          <div className="mt-2 rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-3">
            <p className="text-xs text-[#fca5a5] leading-relaxed">{testError}</p>
            <button
              type="button"
              onClick={() => void runConnectionTest()}
              className="mt-3 rounded-md border border-[rgba(255,255,255,0.12)] px-3 py-1.5 text-xs text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)]"
            >
              {ta.retry}
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-[rgba(255,255,255,0.08)] p-3 bg-[rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className={labelCls + ' !mb-0'}>{ta.modelLabel}</label>
          <span className="text-[10px] text-[#6b6b7a]">{modelStatus}</span>
        </div>
        {!hasActiveKey ? (
          <p className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-4 text-xs text-[#6b6b7a] text-center">
            {formatMessage(ta.addKeyHint, { provider: activeProviderLabel })}
          </p>
        ) : (
          <>
            <input
              type="text"
              value={activeModel}
              onChange={(event) => setModel(provider, event.target.value)}
              placeholder={getDefaultModel(provider) || ta.modelPlaceholderFallback}
              className={`${monoInputCls} mb-2`}
              autoComplete="off"
            />
            {loadingModels ? (
              <p className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-4 text-xs text-[#6b6b7a] text-center">
                {formatMessage(ta.loadingModels, { provider: activeProviderLabel })}
              </p>
            ) : activeModelError ? (
              <div className="rounded-lg border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-3 py-3">
                <p className="text-xs text-[#fca5a5] leading-relaxed">
                  {formatMessage(ta.loadModelsFailed, { provider: activeProviderLabel, error: activeModelError })}
                </p>
                <p className="mt-1 text-[11px] text-[#9ca3af]">{ta.noFallbackHint}</p>
                <button
                  type="button"
                  onClick={() => setModelLoadNonce((value) => value + 1)}
                  className="mt-3 rounded-md border border-[rgba(255,255,255,0.12)] px-3 py-1.5 text-xs text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)]"
                >
                  {ta.retryConnection}
                </button>
              </div>
            ) : (
              <>
                <input
                  type="search"
                  value={modelSearch}
                  onChange={(event) => setModelSearch(event.target.value)}
                  placeholder={ta.searchModelsPlaceholder}
                  className={`${inputCls} mb-2`}
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.08)]">
                  {filteredModels.length ? filteredModels.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => setModel(provider, model.id)}
                      className={`block w-full text-left px-3 py-2 border-b border-[rgba(255,255,255,0.06)] last:border-b-0 transition-colors ${
                        activeModel === model.id
                          ? 'bg-accent-soft text-accent-text'
                          : 'text-[#b8b8c8] hover:bg-[rgba(255,255,255,0.05)]'
                      }`}
                    >
                      <span className="block text-xs font-medium">{model.name}</span>
                      <span className="block text-[11px] font-mono text-[#6b6b7a]">{model.id}</span>
                      {model.description && <span className="block text-[10px] text-[#4a4a5a] line-clamp-2 mt-0.5">{model.description}</span>}
                    </button>
                  )) : (
                    <p className="px-3 py-4 text-xs text-[#6b6b7a] text-center">{ta.noMatchingModels}</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
