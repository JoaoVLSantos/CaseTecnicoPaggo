// components/chat/ChatContent.tsx
import { FC, useEffect, useState, FormEvent, useRef } from 'react'
import { FiArrowRight } from 'react-icons/fi'

interface Interaction {
  id: string
  question: string  // vazia se for o resumo inicial
  answer: string
  createdAt: string
}

interface ChatFull {
  id: string
  interactions: Interaction[]
}

interface Props {
  chatId: string
}

export const ChatContent: FC<Props> = ({ chatId }) => {
  const [chat, setChat] = useState<ChatFull | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const base = process.env.NEXT_PUBLIC_API_URL || ''
  const responsesRef = useRef<HTMLDivElement>(null)

  // Carrega o chat sempre que o chatId muda
  useEffect(() => {
    loadChat()
  }, [chatId])

  // Função que faz fetch do chat completo, com interactions
  const loadChat = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${base}/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Falha ao buscar chat')
      setChat(data)
      // rolar para o fim das mensagens
      setTimeout(() => {
        responsesRef.current?.scrollTo({
          top: responsesRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }, 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Envia uma nova pergunta e recarrega o chat
  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`${base}/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Falha ao enviar mensagem')
      setMessage('')
      await loadChat()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !chat) return <p>Carregando chat…</p>
  if (error   && !chat) return <p className="error">{error}</p>
  if (!chat)            return null

  // Constrói a lista de mensagens a partir de interactions
  const items: { sender: 'ai' | 'user'; content: string }[] = []

  chat.interactions.forEach((intr, idx) => {
    // se question estiver preenchido, renderiza bubble do usuário
    if (intr.question) {
      items.push({ sender: 'user', content: intr.question })
    }
    // sempre renderiza a resposta da IA (ou o resumo inicial)
    items.push({ sender: 'ai', content: intr.answer })
  })

  return (
    <div className="chat-content">
      {error && <p className="error">{error}</p>}

      <div className="responses" ref={responsesRef}>
        {items.map((m, idx) => (
          <div
            key={idx}
            className={`bubble ${m.sender === 'ai' ? 'bubble-ai' : 'bubble-user'}`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="chat-footer">
        <input
          className="pill-input"
          type="text"
          placeholder="Faça uma pergunta…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="button--send"
          disabled={loading || !message.trim()}
        >
          <FiArrowRight size={20} />
        </button>
      </form>
    </div>
  )
}