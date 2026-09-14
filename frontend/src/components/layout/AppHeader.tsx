import { Bell, ChevronDown, Menu, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import type { ChatConversation } from '@/types/chat'

type AppHeaderProps = {
  appLabel?: string
  pageTitle: string
  userName: string
  initials: string
  profilePath?: string
  roleLabel?: string
  onOpenMobileMenu: () => void
  onLogout: () => void
  chatUnreadCount?: number
  chatConversations?: ChatConversation[]
  onOpenChatConversation?: (conversationId: number) => void
}

export function AppHeader({
  appLabel = 'Eklipse Paciente',
  pageTitle,
  userName,
  initials,
  profilePath = '/perfil',
  roleLabel = 'Paciente',
  onOpenMobileMenu,
  onLogout,
  chatUnreadCount = 0,
  chatConversations = [],
  onOpenChatConversation,
}: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen && !notificationsOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
        setNotificationsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen, notificationsOpen])

  return (
    <header className="app-topbar">
      <div className="topbar-leading">
        <button
          type="button"
          className="icon-button mobile-only"
          aria-label="Abrir menu lateral"
          onClick={onOpenMobileMenu}
        >
          <Menu size={20} />
        </button>
        <div className="topbar-titles">
          <p className="eyebrow">{appLabel}</p>
          <h1>{pageTitle}</h1>
        </div>
      </div>

      <div className="topbar-actions" ref={menuRef}>
        <p className="topbar-greeting">Hola, {userName}</p>
        <div className="user-menu">
          <button
            type="button"
            className="icon-button notifications-button"
            aria-label={`Notificaciones${chatUnreadCount ? `, ${chatUnreadCount} sin leer` : ''}`}
            aria-expanded={notificationsOpen}
            onClick={() => { setNotificationsOpen(current => !current); setMenuOpen(false) }}
          >
            {chatUnreadCount > 0 ? <span className="notifications-count">{chatUnreadCount > 99 ? '99+' : chatUnreadCount}</span> : null}
            <Bell size={18} />
          </button>
          {notificationsOpen ? <div className="notification-popover">
            <header><strong>Mensajes</strong><Link to="/chat" onClick={() => setNotificationsOpen(false)}>Abrir chat</Link></header>
            {chatConversations.slice(0, 5).map(conversation => <button key={conversation.id} type="button" onClick={() => { setNotificationsOpen(false); onOpenChatConversation?.(conversation.id) }}>
              <span className="notification-avatar">{conversation.contact.name.slice(0, 1).toUpperCase()}</span>
              <span><strong>{conversation.contact.name}</strong><small>{conversation.lastMessage?.content || 'Archivo adjunto'}</small></span>
              <b>{conversation.unreadCount}</b>
            </button>)}
            {!chatConversations.length ? <p>No tienes mensajes nuevos.</p> : null}
          </div> : null}
        </div>

        <div className="user-menu">
          <button
            type="button"
            className="user-menu-trigger"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <div className="avatar-badge" aria-hidden="true">
              {initials}
            </div>
            <div className="user-menu-copy">
              <span>{userName}</span>
              <small>{roleLabel}</small>
            </div>
            <ChevronDown size={16} aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div className="user-menu-popover" role="menu">
              <Link
                to={profilePath}
                className="user-menu-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <UserRound size={16} aria-hidden="true" />
                Mi perfil
              </Link>
              <button
                type="button"
                className="user-menu-item user-menu-item-button"
                role="menuitem"
                onClick={onLogout}
              >
                Cerrar sesion
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
