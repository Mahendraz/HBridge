import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';

export interface ConversationParticipant {
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: string;
  isActive: boolean;
  unreadCount: number;
}

export interface Conversation {
  _id: string;
  participants: ConversationParticipant[];
  type: 'direct' | 'group';
  title?: string;
  childId?: {
    _id: string;
    name: string;
  };
  lastMessage?: {
    _id: string;
    content: string;
    messageType: string;
    sentAt: string;
    senderId: string;
  };
  lastActivity: string;
  unreadCount: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'file' | 'media';
  sentAt: string;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add proper query parameters that match schema validation
      const queryParams = new URLSearchParams({
        limit: '20',
        offset: '0',
        includeArchived: 'false'
      });
      
      // Don't include optional parameters like type and childId if they're not needed
      // This avoids validation errors for null values
      
      const response = await fetch(`/api/conversations?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // Get error details for better debugging
        const errorText = await response.text();
        console.error('Conversations API Error:', errorText);
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setConversations(result.data.conversations || []);
      } else {
        throw new Error(result.error || 'Failed to fetch conversations');
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setConversations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations
  };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Add proper query parameters that match schema validation
      const queryParams = new URLSearchParams({
        limit: '50',
        offset: '0'
      });
      
      const response = await fetch(`/api/conversations/${conversationId}/messages?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // Get error details for better debugging
        const errorText = await response.text();
        console.error('Messages API Error:', errorText);
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMessages(result.data.messages || []);
      } else {
        throw new Error(result.error || 'Failed to fetch messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text') => {
    if (!conversationId || !content.trim()) return false;

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId,
          content: content.trim(),
          messageType,
          attachmentIds: []
        })
      });

      if (!response.ok) {
        // Get error details for better debugging
        const errorText = await response.text();
        console.error('Send Message API Error:', errorText);
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Add the new message to the list
        setMessages(prev => [...prev, result.data.message]);
        return true;
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages
  };
}