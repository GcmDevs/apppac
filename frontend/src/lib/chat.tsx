import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAuthSession } from '@/lib/auth';
import type {
  ChatActionAck,
  ChatConnectionState,
  ChatContact,
  ChatConversation,
  ChatConversationDetails,
  ChatMessage,
} from '@/types/chat';

const SOCKET_URL = 'https://cloud.grupoclinicamedicos.com/socket';
const API_URL = 'https://cloud.grupoclinicamedicos.com';
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

type ChatContextValue = {
  connection: ChatConnectionState;
  error: string;
  conversations: ChatConversation[];
  active: ChatConversation | null;
  messages: ChatMessage[];
  searchResults: ChatContact[];
  unreadCount: number;
  typing: boolean;
  hasMore: boolean;
  loadingPrevious: boolean;
  currentUserActive: boolean;
  search(query: string): Promise<string | null>;
  start(document: string): Promise<string | null>;
  open(id: number): Promise<string | null>;
  close(): void;
  markRead(id?: number): Promise<void>;
  hide(id: number): Promise<string | null>;
  loadPrevious(): Promise<void>;
  send(content: string, files: File[], replyId?: number): Promise<string | null>;
  edit(id: number, content: string): Promise<string | null>;
  remove(id: number): Promise<string | null>;
  reportTyping(value: boolean): void;
  attachmentUrl(path: string): string;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const activeRef = useRef<ChatConversation | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const typingTimer = useRef<number | null>(null);
  const [connection, setConnection] = useState<ChatConnectionState>('connecting');
  const [error, setError] = useState('');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [active, setActive] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchResults, setSearchResults] = useState<ChatContact[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [typingIds, setTypingIds] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [currentUserActive, setCurrentUserActive] = useState(true);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const upsert = useCallback((conversation: ChatConversation) => {
    setConversations(current =>
      [conversation, ...current.filter(item => item.id !== conversation.id)]
        .filter(item => !item.hidden)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
    setActive(current => (current?.id === conversation.id ? conversation : current));
  }, []);

  useEffect(() => {
    const token = getAuthSession()?.token;
    if (!token) {
      setConnection('disconnected');
      setError('No hay una sesión activa.');
      return;
    }
    const socket = io(SOCKET_URL, {
      auth: { token, clientApp: 'pacientes-frontend' },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    socket.on('connect', () => {
      setConnection('connected');
      setError('');
    });
    socket.on('connect_error', reason => {
      setConnection('disconnected');
      setError(reason.message || 'No fue posible conectar el chat.');
    });
    socket.on('disconnect', () => {
      setConnection('disconnected');
      setError('Se perdió la conexión. Intentaremos reconectar.');
    });
    socket.on(
      'chat:bootstrap',
      (data: {
        conversations: ChatConversation[];
        notifications: { unreadCount: number };
        security: { locked: boolean };
        currentUserActive: boolean;
      }) => {
        if (data.security?.locked) {
          setError('El chat tiene un PIN configurado. Solicita que lo desactiven desde Eklipse.');
          return;
        }
        setConversations(
          [...data.conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        );
        setNotificationCount(data.notifications?.unreadCount ?? 0);
        setCurrentUserActive(data.currentUserActive !== false);
      }
    );
    socket.on('chat:conversation:updated', (conversation: ChatConversation) =>
      upsert(conversation)
    );
    socket.on('chat:conversation:hidden', ({ conversationId }: { conversationId: number }) => {
      setConversations(current => current.filter(item => item.id !== conversationId));
      if (activeRef.current?.id === conversationId) {
        setActive(null);
        setMessages([]);
      }
    });
    socket.on('chat:message:new', (message: ChatMessage) => {
      if (activeRef.current?.id === message.conversationId)
        setMessages(current =>
          current.some(item => item.id === message.id) ? current : [...current, message]
        );
    });
    socket.on('chat:message:updated', (message: ChatMessage) =>
      setMessages(current =>
        current.map(item =>
          item.id === message.id
            ? message
            : item.replyTo?.id === message.id
              ? {
                  ...item,
                  replyTo: {
                    id: message.id,
                    content: message.content,
                    attachments: message.attachments,
                    deletedAt: message.deletedAt,
                    sender: message.sender,
                  },
                }
              : item
        )
      )
    );
    socket.on(
      'chat:typing',
      ({ conversationId, typing }: { conversationId: number; typing: boolean }) =>
        setTypingIds(current => {
          const next = new Set(current);
          typing ? next.add(conversationId) : next.delete(conversationId);
          return next;
        })
    );
    socket.on(
      'chat:contact:presence',
      ({ document, online }: { document: string; online: boolean }) =>
        setConversations(current =>
          current.map(item =>
            item.contact.document === document
              ? { ...item, contact: { ...item.contact, online } }
              : item
          )
        )
    );
    socket.on('chat:notifications:state', ({ unreadCount }: { unreadCount: number }) =>
      setNotificationCount(unreadCount)
    );
    socket.on('exception', (reason: string | { message?: string }) =>
      setError(
        typeof reason === 'string' ? reason : (reason.message ?? 'El chat rechazó la solicitud.')
      )
    );
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [upsert]);

  const request = useCallback(
    <T,>(event: string, payload: unknown): Promise<ChatActionAck<T>> =>
      new Promise(resolve => {
        const socket = socketRef.current;
        if (!socket?.connected) {
          resolve({ ok: false, error: 'Espera a que el chat vuelva a conectarse.' });
          return;
        }
        let completed = false;
        const timeout = window.setTimeout(() => {
          completed = true;
          resolve({ ok: false, error: 'La solicitud tardó demasiado.' });
        }, 8000);
        socket.emit(event, payload, (response: ChatActionAck<T>) => {
          if (completed) return;
          window.clearTimeout(timeout);
          resolve(response);
        });
      }),
    []
  );

  const activate = useCallback(
    (details: ChatConversationDetails) => {
      upsert(details.conversation);
      setActive(details.conversation);
      setMessages(details.messages);
      setHasMore(details.hasMoreMessages);
      setSearchResults([]);
    },
    [upsert]
  );
  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return null;
      }
      const result = await request<ChatContact[]>('chat:users:search', { query });
      setSearchResults(result.data ?? []);
      return result.ok ? null : (result.error ?? 'No fue posible buscar.');
    },
    [request]
  );
  const start = useCallback(
    async (document: string) => {
      const result = await request<ChatConversationDetails>('chat:conversation:start', {
        document,
      });
      if (result.data) activate(result.data);
      return result.ok ? null : (result.error ?? 'No fue posible iniciar la conversación.');
    },
    [activate, request]
  );
  const open = useCallback(
    async (id: number) => {
      const result = await request<ChatConversationDetails>('chat:conversation:open', {
        conversationId: id,
        markAsRead: true,
      });
      if (result.data) activate(result.data);
      return result.ok ? null : (result.error ?? 'No fue posible abrir la conversación.');
    },
    [activate, request]
  );
  const close = useCallback(() => {
    setActive(null);
    setMessages([]);
  }, []);
  const markRead = useCallback(
    async (id = activeRef.current?.id) => {
      if (!id) return;
      const result = await request<ChatConversation>('chat:conversation:read', {
        conversationId: id,
      });
      if (result.data) upsert(result.data);
    },
    [request, upsert]
  );
  const hide = useCallback(
    async (id: number) => {
      const result = await request('chat:conversation:hide', { conversationId: id });
      if (result.ok) {
        setConversations(current => current.filter(item => item.id !== id));
        if (activeRef.current?.id === id) close();
      }
      return result.ok ? null : (result.error ?? 'No fue posible ocultarla.');
    },
    [close, request]
  );
  const loadPrevious = useCallback(async () => {
    const first = messagesRef.current[0];
    if (!activeRef.current || !first || !hasMore || loadingPrevious) return;
    setLoadingPrevious(true);
    const result = await request<{ messages: ChatMessage[]; hasMoreMessages: boolean }>(
      'chat:messages:previous',
      { conversationId: activeRef.current.id, beforeMessageId: first.id }
    );
    if (result.data) {
      setMessages(current => [
        ...result.data!.messages.filter(item => !current.some(existing => existing.id === item.id)),
        ...current,
      ]);
      setHasMore(result.data.hasMoreMessages);
    }
    setLoadingPrevious(false);
  }, [hasMore, loadingPrevious, request]);
  const send = useCallback(
    async (content: string, files: File[], replyId?: number) => {
      if (files.length > MAX_ATTACHMENTS)
        return `Puedes adjuntar hasta ${MAX_ATTACHMENTS} archivos.`;
      if (files.some(file => file.size > MAX_FILE_SIZE))
        return 'Cada archivo debe pesar como máximo 20 MB.';
      let attachments: string[] = [];
      try {
        if (files.length) {
          const body = new FormData();
          body.append('folder', 'chat-files');
          files.forEach(file => body.append('files', file, file.name));
          const token = getAuthSession()?.token;
          const response = await fetch(`${API_URL}/file-saver`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body,
          });
          if (!response.ok) throw new Error();
          attachments = (await response.json()) as string[];
        }
        const result = await request<ChatMessage>('chat:message:send', {
          conversationId: activeRef.current?.id,
          content,
          attachments,
          replyToMessageId: replyId ?? null,
        });
        if (!result.ok && result.cleanupAttachments && attachments.length) {
          const params = new URLSearchParams({ deleteForever: 'true' });
          attachments.forEach(path => params.append('paths', path));
          const token = getAuthSession()?.token;
          void fetch(`${API_URL}/file-saver?${params}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }
        return result.ok ? null : (result.error ?? 'No fue posible enviar el mensaje.');
      } catch {
        return 'No fue posible adjuntar los archivos.';
      }
    },
    [request]
  );
  const edit = useCallback(
    async (id: number, content: string) => {
      const result = await request<ChatMessage>('chat:message:edit', { messageId: id, content });
      return result.ok ? null : (result.error ?? 'No fue posible editar.');
    },
    [request]
  );
  const remove = useCallback(
    async (id: number) => {
      const result = await request<ChatMessage>('chat:message:delete', { messageId: id });
      return result.ok ? null : (result.error ?? 'No fue posible eliminar.');
    },
    [request]
  );
  const reportTyping = useCallback((value: boolean) => {
    const socket = socketRef.current,
      conversationId = activeRef.current?.id;
    if (!socket?.connected || !conversationId) return;
    socket.emit('chat:typing', { conversationId, typing: value });
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    if (value)
      typingTimer.current = window.setTimeout(
        () => socket.emit('chat:typing', { conversationId, typing: false }),
        1800
      );
  }, []);
  const attachmentUrl = useCallback((path: string) => `${API_URL}/${path.replace(/^\/+/, '')}`, []);
  const unreadCount = Math.max(
    notificationCount,
    conversations.reduce((total, item) => total + item.unreadCount, 0)
  );
  const value = useMemo(
    () => ({
      connection,
      error,
      conversations,
      active,
      messages,
      searchResults,
      unreadCount,
      typing: !!active && typingIds.has(active.id),
      hasMore,
      loadingPrevious,
      currentUserActive,
      search,
      start,
      open,
      close,
      markRead,
      hide,
      loadPrevious,
      send,
      edit,
      remove,
      reportTyping,
      attachmentUrl,
    }),
    [
      connection,
      error,
      conversations,
      active,
      messages,
      searchResults,
      unreadCount,
      typingIds,
      hasMore,
      loadingPrevious,
      currentUserActive,
      search,
      start,
      open,
      close,
      markRead,
      hide,
      loadPrevious,
      send,
      edit,
      remove,
      reportTyping,
      attachmentUrl,
    ]
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat requiere ChatProvider.');
  return context;
}
