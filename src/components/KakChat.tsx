import { useEffect, useRef, useState } from 'react'
import { useKakChat } from '../state/useKakChat'
import { useScrollToTop } from '../state/useScrollToTop'
import { ChatIcon } from './icons'
import { TABBAR_HEIGHT } from './TabBar'
import { ScreenHeader } from './ScreenHeader'

function Bubble({ role, content }: { role: 'user' | 'kak'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
        style={
          isUser
            ? { backgroundColor: 'var(--color-ember-600)', color: 'var(--color-wood-950)' }
            : { border: '1px solid rgba(203, 170, 106, 0.3)', color: 'var(--color-paper-100)' }
        }
      >
        {content}
      </div>
    </div>
  )
}

export function KakChat({ onBack }: { onBack: () => void }) {
  useScrollToTop()
  const { messages, loading, error, send } = useKakChat()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages, loading])

  const submit = () => {
    if (!draft.trim() || loading) return
    send(draft)
    setDraft('')
  }

  return (
    <div className="space-y-5" style={{ paddingBottom: `calc(${TABBAR_HEIGHT}px + 76px)` }}>
      <ScreenHeader title="Kak" onBack={onBack} />

      <div className="space-y-3">
        {messages.length === 0 && (
          <Bubble role="kak" content="Dale, pegame la duda. ¿Qué querés saber del truco?" />
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <Bubble role="kak" content="Pensando..." />}
        {error && (
          <p className="text-sm text-center" style={{ color: '#d9695f' }}>
            {error}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="fixed left-0 right-0 z-10 px-4 py-3 flex items-center gap-2"
        style={{
          bottom: TABBAR_HEIGHT,
          backgroundColor: 'var(--color-wood-900)',
          borderTop: '1px solid rgba(203, 170, 106, 0.2)',
          boxShadow: '0 -8px 20px rgba(0,0,0,0.35)',
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Preguntale a Kak..."
          disabled={loading}
          className="flex-1 min-w-0 rounded-xl px-3 py-2.5 border outline-none disabled:opacity-50"
          style={{
            borderColor: 'rgba(203, 170, 106, 0.35)',
            backgroundColor: 'rgba(0,0,0,0.2)',
            color: 'var(--color-paper-50)',
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim() || loading}
          aria-label="Enviar"
          className="w-11 h-11 shrink-0 rounded-full border flex items-center justify-center disabled:opacity-40"
          style={{ borderColor: 'var(--color-ember-600)', color: 'var(--color-ember-500)' }}
        >
          <ChatIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
