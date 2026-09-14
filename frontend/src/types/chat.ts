export type ChatConnectionState = 'connecting' | 'connected' | 'disconnected';

export type ChatUser = { document: string; name: string; isActive: boolean };
export type ChatContact = ChatUser & { online: boolean };
export type ChatMessageReply = {
  id: number;
  content: string;
  attachments: string[];
  deletedAt: string | null;
  sender: ChatUser;
};
export type ChatMessage = {
  id: number;
  conversationId: number;
  content: string;
  attachments: string[];
  replyTo: ChatMessageReply | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender: ChatUser;
};
export type ChatConversation = {
  id: number;
  contact: ChatContact;
  lastMessage: ChatMessage | null;
  lastReadMessageId: number | null;
  unreadCount: number;
  hidden: boolean;
  updatedAt: string;
};
export type ChatConversationDetails = {
  conversation: ChatConversation;
  messages: ChatMessage[];
  hasMoreMessages: boolean;
};
export type ChatActionAck<T> = {
  ok: boolean;
  data?: T;
  error?: string;
  cleanupAttachments?: boolean;
  requiresPin?: boolean;
};
