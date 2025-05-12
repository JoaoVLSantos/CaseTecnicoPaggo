import { FC, ReactNode, useState, ChangeEvent, useEffect } from 'react'
import { FiCheck, FiX, FiPlus, FiPrinter } from 'react-icons/fi'

export interface Chat { id: string; title?: string; }

interface User { name: string; email: string; }

interface Props {
  user: User
  onUpdateProfile: (name?: string, email?: string, password?: string) => Promise<void>
  onLogout: () => void
  chats: Chat[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onPrint: () => void
  children?: ReactNode
}

export const Layout: FC<Props> = ({
  user,
  onUpdateProfile,
  onLogout,
  chats,
  selectedId,
  onSelect,
  onNew,
  onPrint,
  children,
}) => {
  const [showCard, setShowCard] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  // Sempre que o usuário vier de fora, resetamos os campos
  useEffect(() => {
    setName(user.name)
    setEmail(user.email)
  }, [user])

  const toggleCard = () => {
    if (showCard) {
      // ao fechar, sai do modo edição e reseta
      setEditing(false)
      setName(user.name)
      setEmail(user.email)
      setPassword('')
    }
    setShowCard(v => !v)
  }

  const handleConfirm = async () => {
    setBusy(true)
    const delay = new Promise(res => setTimeout(res, 1000))
    const update = onUpdateProfile(
      name.trim() || user.name,
      email.trim() || user.email,
      password.trim() || undefined,
    )
    try {
      await Promise.all([update, delay])
      // fechar após update
      setEditing(false)
      setShowCard(false)
      setPassword('')
    } catch {
      // você pode querer tratar erro aqui (exibir toast, etc)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-container">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Histórico</h3>
          <div>
            <button className="button--new" onClick={onNew}>
              <FiPlus size={20} />
            </button>
            {/*{selectedId && (
              <button className="button--print" onClick={onPrint}>
                <FiPrinter size={20} />
              </button>
            )}}*/}
          </div>
        </div>
        <ul>
          {chats.map((c, i) => (
            <li
              key={c.id}
              className={c.id === selectedId ? 'active' : ''}
              onClick={() => onSelect(c.id)}
            >
              {c.title?.trim() || `Chat ${i + 1}`}
            </li>
          ))}
        </ul>
      </aside>

      {/* ─── Main area ─── */}
      <div className="main-area">
        {/* ─── Top bar ─── */}
        <div className="topbar">
          <button className="button--user" onClick={toggleCard} disabled={busy}>
            Usuário
          </button>
          {showCard && (
            <div className={`user-card ${editing ? 'editing' : 'view'}`}>
              <h4>Informações do usuário</h4>

              {!editing ? (
                <>
                  <div className="pill">{user.name}</div>
                  <div className="pill">{user.email}</div>
                  <button
                    className="btn-edit"
                    onClick={() => setEditing(true)}
                    disabled={busy}
                  >
                    Atualizar
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={name}
                    placeholder="Novo nome (opcional)"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setName(e.target.value)
                    }
                    disabled={busy}
                  />
                  <input
                    type="email"
                    value={email}
                    placeholder="Novo email (opcional)"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    disabled={busy}
                  />
                  <input
                    type="password"
                    value={password}
                    placeholder="Nova senha (opcional)"
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    disabled={busy}
                  />
                  <div className="actions">
                    <button
                      className="confirm"
                      onClick={handleConfirm}
                      disabled={
                        !name.trim() &&
                        !email.trim() &&
                        !password.trim()
                      }
                    >
                      {busy
                        ? <span className="btn-spinner" />
                        : <FiCheck />}
                      Confirmar
                    </button>
                    <button
                      className="cancel"
                      onClick={() => setEditing(false)}
                      disabled={busy}
                    >
                      <FiX /> Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <button className="button--logout" onClick={onLogout} disabled={busy}>
            Logout
          </button>
        </div>

        {/* ─── Conteúdo principal ─── */}
        <div className="content-area">{children}</div>
      </div>
    </div>
  )
}