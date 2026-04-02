import api from "./api";
import type { ChatConversation } from "../types";

export const chatService = {
  // Create new conversation
  createConversation: (title: string) => api.post("/chat/sessions/", { title }),

  // Get conversation history
  getConversations: () => api.get("/chat/sessions/"),

  // Get messages in conversation
  getMessages: (conversationId: string) =>
    api.get(`/chat/sessions/${conversationId}/history/`),

  // Send message
  sendMessage: (conversationId: string, content: string) =>
    api.post(`/chat/sessions/${conversationId}/send_message/`, { content }),

  // Conversation management
  updateConversation: (
    conversationId: string,
    data: Partial<ChatConversation>,
  ) => api.patch(`/chat/sessions/${conversationId}/`, data),

  deleteConversation: (conversationId: string) =>
    api.delete(`/chat/sessions/${conversationId}/`),

  closeConversation: (conversationId: string) =>
    api.post(`/chat/sessions/${conversationId}/close/`),
};
