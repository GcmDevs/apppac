import { ArrowLeft, CheckCheck, Edit3, EyeOff, FileText, LoaderCircle, MessageCircle, Paperclip, Reply, Search, Send, Trash2, WifiOff, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@/lib/chat';
import type { ChatMessage } from '@/types/chat';
import { getAuthSession } from '@/lib/auth';

export function ChatPage() {
  const chat = useChat();
  const document = getAuthSession()?.user.document ?? '';
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const searchTimer = useRef<number | null>(null);

  useEffect(() => { if (chat.active) { void chat.markRead(chat.active.id); endRef.current?.scrollIntoView(); } }, [chat.active?.id, chat.messages.length]);
  useEffect(() => () => { if (searchTimer.current) window.clearTimeout(searchTimer.current); }, []);

  const changeSearch = (value: string) => {
    setQuery(value); setActionError('');
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(async () => setActionError((await chat.search(value)) ?? ''), 250);
  };

  const submit = async () => {
    if (busy || (!draft.trim() && !files.length)) return;
    setBusy(true); setActionError('');
    const error = editing ? await chat.edit(editing.id, draft.trim()) : await chat.send(draft.trim(), files, reply?.id);
    if (error) setActionError(error); else { setDraft(''); setFiles([]); setReply(null); setEditing(null); }
    setBusy(false);
  };

  const list = useMemo(() => chat.conversations.filter(item => item.contact.name.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')) || item.contact.document.includes(query)), [chat.conversations, query]);

  return (
    <main className="chat-page">
      <section className={`chat-inbox ${chat.active ? 'chat-mobile-hidden' : ''}`} aria-label="Conversaciones">
      <header className="chat-inbox-header">
        <div><p className="eyebrow">Acompañamiento</p><h2>Mensajes</h2></div>
        <span className={`chat-connection ${chat.connection}`}><span />{chat.connection === 'connected' ? 'En línea' : chat.connection === 'connecting' ? 'Conectando' : 'Sin conexión'}</span>
      </header>
      <label className="chat-search"><Search size={18} /><input type="search" value={query} onChange={event => changeSearch(event.target.value)} placeholder="Buscar contacto" /></label>
      {query.trim() && chat.searchResults.length ? <div className="chat-search-results">{chat.searchResults.map(contact => <button key={contact.document} type="button" onClick={async () => { setActionError((await chat.start(contact.document)) ?? ''); setQuery(''); }}><Avatar name={contact.name} online={contact.online} /><span><strong>{contact.name}</strong><small>Nueva conversación</small></span></button>)}</div> : null}
      {chat.error ? <div className="chat-inline-error"><WifiOff size={16} />{chat.error}</div> : null}
      {!chat.currentUserActive ? <div className="chat-inactive-alert" role="alert"><WifiOff size={17} /><span><strong>Tu usuario de chat está inactivo.</strong> Puedes consultar el historial, pero no enviar mensajes. Comunícate con el administrador para activarlo nuevamente.</span></div> : null}
      <div className="chat-conversation-list">
        {list.map(conversation => <button key={conversation.id} type="button" className={chat.active?.id === conversation.id ? 'chat-conversation active' : 'chat-conversation'} onClick={() => void chat.open(conversation.id)}>
          <Avatar name={conversation.contact.name} online={conversation.contact.online} />
          <span className="chat-conversation-copy"><span><strong>{conversation.contact.name}</strong><time>{formatListTime(conversation.updatedAt)}</time></span><span><small>{preview(conversation.lastMessage)}</small>{conversation.unreadCount ? <b>{conversation.unreadCount}</b> : <CheckCheck size={15} />}</span></span>
        </button>)}
        {!list.length && !chat.searchResults.length ? <div className="chat-empty"><MessageCircle size={30} /><strong>Aún no hay conversaciones</strong><span>Busca a tu contacto para empezar.</span></div> : null}
      </div>
    </section>

      <section className={`chat-thread ${chat.active ? 'chat-thread-open' : ''}`} aria-label="Conversación activa">
        {chat.active ? <>
          <header className="chat-thread-header">
            <button className="chat-icon-button chat-back" type="button" onClick={chat.close} aria-label="Volver"><ArrowLeft size={20} /></button>
            <Avatar name={chat.active.contact.name} online={chat.active.contact.online} />
            <div><strong>{chat.active.contact.name}</strong><small>{chat.typing ? 'Escribiendo…' : chat.active.contact.online ? 'En línea' : 'Desconectado'}</small></div>
            <button className="chat-icon-button" type="button" title="Ocultar conversación" onClick={async () => { if (window.confirm('¿Ocultar esta conversación? Volverá cuando llegue un mensaje nuevo.')) setActionError((await chat.hide(chat.active!.id)) ?? ''); }}><EyeOff size={19} /></button>
          </header>
          <div className="chat-messages">
            {!chat.active.contact.isActive ? <div className="chat-contact-inactive" role="alert"><WifiOff size={17} /><span>Ya no es posible comunicarse con esta persona. El historial permanece disponible.</span></div> : null}
            {chat.hasMore ? <button className="chat-load-previous" type="button" disabled={chat.loadingPrevious} onClick={() => void chat.loadPrevious()}>{chat.loadingPrevious ? 'Cargando…' : 'Cargar mensajes anteriores'}</button> : null}
            {chat.messages.map(message => <MessageBubble key={message.id} message={message} mine={message.sender.document === document} attachmentUrl={chat.attachmentUrl} onReply={() => { setReply(message); setEditing(null); }} onEdit={() => { setEditing(message); setReply(null); setDraft(message.content); }} onDelete={async () => { if (window.confirm('¿Eliminar este mensaje?')) setActionError((await chat.remove(message.id)) ?? ''); }} />)}
            <div ref={endRef} />
          </div>
          <footer className="chat-composer">
            {reply || editing ? <div className="chat-compose-context"><span>{editing ? 'Editando mensaje' : `Respondiendo a ${reply?.sender.name}`}<small>{editing ? editing.content : reply?.content || 'Archivo adjunto'}</small></span><button type="button" onClick={() => { setReply(null); setEditing(null); setDraft(''); }}><X size={17} /></button></div> : null}
            {files.length ? <div className="chat-file-list">{files.map((file, index) => <span key={`${file.name}-${index}`}><FileText size={15} />{file.name}<button type="button" onClick={() => setFiles(current => current.filter((_, i) => i !== index))}><X size={14} /></button></span>)}</div> : null}
            {actionError ? <p className="chat-action-error">{actionError}</p> : null}
            <div className="chat-compose-row">
              {!editing ? <label className="chat-icon-button" aria-disabled={!chat.currentUserActive || !chat.active.contact.isActive} title="Adjuntar archivos"><Paperclip size={20} /><input hidden multiple disabled={!chat.currentUserActive || !chat.active.contact.isActive} type="file" onChange={event => setFiles(current => [...current, ...Array.from(event.target.files ?? [])].slice(0, 10))} /></label> : null}
              <textarea value={draft} disabled={!editing && (!chat.currentUserActive || !chat.active.contact.isActive)} onChange={event => { setDraft(event.target.value); chat.reportTyping(Boolean(event.target.value)); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); } }} maxLength={10000} rows={1} placeholder={!chat.currentUserActive || !chat.active.contact.isActive ? 'Envío de mensajes deshabilitado' : 'Escribe un mensaje'} aria-label="Mensaje" />
              <button className="chat-send" type="button" disabled={busy || (!editing && (!chat.currentUserActive || !chat.active.contact.isActive)) || (!draft.trim() && !files.length)} onClick={() => void submit()}>{busy ? <LoaderCircle className="spin" size={20} /> : <Send size={20} />}</button>
            </div>
          </footer>
        </> : <div className="chat-welcome"><span><MessageCircle size={34} /></span><h2>Tu espacio de conversación</h2><p>Selecciona un contacto para conversar de forma privada con tu equipo de acompañamiento.</p></div>}
      </section>
    </main>
  );
}

function MessageBubble({ message, mine, attachmentUrl, onReply, onEdit, onDelete }: { message: ChatMessage; mine: boolean; attachmentUrl(path: string): string; onReply(): void; onEdit(): void; onDelete(): void }) {
  const mutable = mine && !message.deletedAt && Date.now() - new Date(message.createdAt).getTime() <= 10 * 60 * 1000;
  return <article className={mine ? 'chat-message mine' : 'chat-message'}>
    {message.replyTo ? <div className="chat-reply-preview"><Reply size={13} /><strong>{message.replyTo.sender.name}</strong><span>{message.replyTo.deletedAt ? 'Mensaje eliminado' : message.replyTo.content || 'Archivo adjunto'}</span></div> : null}
    {message.deletedAt ? <p className="chat-deleted">Mensaje eliminado</p> : <><p>{message.content}</p>{message.attachments.length ? <div className="chat-attachments">{message.attachments.map(path => isImage(path) ? <a key={path} href={attachmentUrl(path)} target="_blank" rel="noreferrer"><img src={attachmentUrl(path)} alt="Archivo adjunto" /></a> : <a key={path} href={attachmentUrl(path)} target="_blank" rel="noreferrer"><FileText size={17} />{fileName(path)}</a>)}</div> : null}</>}
    <footer><time>{formatTime(message.createdAt)}{message.editedAt ? ' · editado' : ''}</time>{!message.deletedAt ? <button type="button" onClick={onReply} title="Responder"><Reply size={14} /></button> : null}{mutable ? <><button type="button" onClick={onEdit} title="Editar"><Edit3 size={14} /></button><button type="button" onClick={onDelete} title="Eliminar"><Trash2 size={14} /></button></> : null}</footer>
  </article>;
}

function Avatar({ name, online }: { name: string; online: boolean }) { return <span className="chat-avatar">{name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()}<i className={online ? 'online' : ''} /></span>; }
function formatTime(value: string) { return new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
function formatListTime(value: string) { const date = new Date(value); return date.toDateString() === new Date().toDateString() ? formatTime(value) : new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' }).format(date); }
function preview(message: ChatMessage | null) { if (!message) return 'Conversación nueva'; if (message.deletedAt) return 'Mensaje eliminado'; return message.content || `${message.attachments.length} archivo${message.attachments.length === 1 ? '' : 's'}`; }
function fileName(path: string) { return decodeURIComponent(path.split('/').pop() ?? 'Archivo'); }
function isImage(path: string) { return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(path); }
