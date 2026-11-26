import { useEffect, useRef, useState } from 'react'
import { useKakChat } from '../state/useKakChat'
import { useVisualViewportMetrics } from '../state/useVisualViewportMetrics'
import { ChatIcon } from './icons'
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
  const { messages, loading, error, send } = useKakChat()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const { top, height, keyboardOpen } = useVisualViewportMetrics()

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages, loading])

  const submit = () => {
    if (!draft.trim() || loading) return
    send(draft)
    setDraft('')
  }

  return (
    // Clavada al viewport VISUAL (no al "de layout"/100dvh): en iOS el
    // teclado no siempre achica ese segundo, pero sí el primero, que es lo
    // que en verdad se ve en pantalla. Con el alto fijado a mano acá (en vez
    // de confiar en CSS + el scroll normal de la página), el header queda
    // siempre arriba, la lista de mensajes se achica y scrollea por su
    // cuenta, y la barra de escribir queda pegada exactamente arriba del
    // teclado sin huecos — como en cualquier app de chat (WhatsApp y demás).
    <div className="fixed left-0 right-0 flex flex-col" style={{ top, height, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-md mx-auto w-full px-4 flex-1 flex flex-col gap-4 min-h-0">
        <ScreenHeader title="Kak" onBack={onBack} />

        {/* "justify-end" en vez de centrar: en un chat los mensajes se leen
            pegados a la barra de escribir, no flotando a mitad de pantalla.
            "overflow-y-auto" propio (no el scroll de la página entera): así
            es esta lista, y no el header ni la barra de abajo, la que se
            achica cuando el teclado deja menos lugar. */}
        <div className="flex-1 flex flex-col justify-end gap-3 min-h-0 overflow-y-auto">
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

        {/* El margen extra para el home indicator solo hace falta cuando no
            hay teclado: con el teclado abierto el indicator queda tapado, y
            ese margen de más dejaba un hueco vacío entre la barra y el
            teclado. */}
        <div
          className="-mx-4 px-4 pt-3 flex items-center gap-2 shrink-0"
          style={{
            paddingBottom: keyboardOpen ? '0.75rem' : 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
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
    </div>
  )
}
