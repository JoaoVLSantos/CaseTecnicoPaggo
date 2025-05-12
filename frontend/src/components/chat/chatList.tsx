// components/chat/chatList.tsx
import { FC } from 'react'
import { FiPlus, FiPrinter } from 'react-icons/fi'

export interface Chat {
  id: string
  createdAt: string
  imageUrl: string
  title?: string
}

interface Props {
  chats: Chat[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onPrint: () => void
}

export const ChatList: FC<Props> = ({
  chats,
  selectedId,
  onSelect,
  onNew,
  onPrint,
}) => {
  return (
    <aside className="sidebar">
      {/* cabeçalho com “Histórico”, botão de novo chat e print */}
      <div className="sidebar-header">
        <h3>Histórico</h3>
        <div>
          <button className="button--new" onClick={onNew}>
            <FiPlus size={20} />
          </button>
          {selectedId && (
            <button className="button--print" onClick={onPrint}>
              <FiPrinter size={20} />
            </button>
          )}
        </div>
      </div>

      <ul>
        {chats.map((chat, idx) => (
          <li
            key={chat.id}
            className={chat.id === selectedId ? 'active' : ''}
            onClick={() => onSelect(chat.id)}
          >
            {/* título do chat: ou o próprio title, ou “Chat X” */}
            {chat.title?.trim()
              ? chat.title
              : `Chat ${idx + 1}`}
          </li>
        ))}
      </ul>
    </aside>
  )
}