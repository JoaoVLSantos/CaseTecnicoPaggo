// pages/chats.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { ChatUpload } from '@/components/chat/ChatUpload'
import { ChatContent } from '@/components/chat/ChatContent'
import { Layout, Chat } from '@/components/Layout'

interface User { name: string; email: string }

export default function ChatsPage() {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [user, setUser] = useState<User>({ name: '', email: '' })

  const base = process.env.NEXT_PUBLIC_API_URL || ''

  // 1) ao montar, checa token e carrega usuário e lista de chats
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/')
        return
      }
      // decodifica o payload do JWT só pra obter o email/name
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUser({
          name: payload.email.split('@')[0],
          email: payload.email,
        })
      } catch {
        localStorage.removeItem('access_token')
        router.push('/')
        return
      }

      // busca histórico de chats
      try {
        const res = await fetch(`${base}/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Falha ao carregar chats')
        const data: Chat[] = await res.json()
        setChats(data)
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [base, router])

  // Handlers do sidebar
  const handleSelect = (id: string) => setSelected(id)
  const handleNewChat = () => setSelected(null)

  /* faz download do PDF sem abrir nova janela
  const handlePrint = async () => {
    if (!selected) return
  const token = localStorage.getItem('access_token')

  try {
    const res = await fetch(`${base}/chats/${selected}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      // clona para extrair JSON de erro, sem consumir o body original
      const errRes = res.clone()
      let errorMsg = `Status ${res.status} — ${res.statusText}`

      try {
        const payload = await errRes.json()
        if (payload?.message) {
          errorMsg = `Status ${res.status} — ${payload.message}`
        }
      } catch {
        throw new Error(errorMsg)
      }
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${selected}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error('Erro ao baixar PDF', err)
    alert(`Erro ao baixar o PDF:\n${err.message || 'Erro desconhecido'}`)
  }
  } */

  // Handler de logout
  const handleLogout = async () => {
    const token = localStorage.getItem('access_token')
    await fetch(`${base}/auth/signout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    localStorage.removeItem('access_token')
    router.push('/')
  }

  // Handler de upload de nova imagem/chat
  const handleUploaded = (chat: Chat) => {
    setChats(prev => [chat, ...prev])
    setSelected(chat.id)
  }

  // Handler de atualização de perfil com feedback mínimo de 1s
  const handleUpdateProfile = async (
    newName?: string,
    newEmail?: string,
    newPassword?: string
  ) => {
    const token = localStorage.getItem('access_token')
    const start = Date.now()
    const res = await fetch(`${base}/auth/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...(newName ? { name: newName } : {}),
        ...(newEmail ? { email: newEmail } : {}),
        ...(newPassword ? { password: newPassword } : {}),
      }),
    })
    const elapsed = Date.now() - start
    // força mínimo de 1s
    if (elapsed < 1000) {
      await new Promise(r => setTimeout(r, 1000 - elapsed))
    }
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Falha ao atualizar perfil')
    }
    // atualiza state local do usuário
    setUser({
      name: newName?.trim() || user.name,
      email: newEmail?.trim() || user.email,
    })
  }

  return (
    <Layout
      user={user}
      onUpdateProfile={handleUpdateProfile}
      onLogout={handleLogout}
      chats={chats}
      selectedId={selected}
      onSelect={handleSelect}
      onNew={handleNewChat} onPrint={function (): void {
        throw new Error('Function not implemented.')
      } }      //onPrint={handlePrint}
    >
      {selected ? (
        <ChatContent chatId={selected} />
      ) : (
        <ChatUpload onUploaded={handleUploaded} />
      )}
    </Layout>
  )
}
