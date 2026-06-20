"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConversations, useMessages } from "@/lib/hooks/useConversations";
import { useAuth } from "@/lib/contexts/auth-context";
import {
  MessageSquareIcon,
  SendIcon,
  UserIcon,
  ClockIcon,
  SearchIcon,
  PlusIcon,
  AlertCircleIcon,
  XIcon,
} from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const autoStartRef = useRef(false);

  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatContacts, setNewChatContacts] = useState<Array<{
    userId: string; userName: string; childId?: string; childName?: string;
  }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const { conversations, loading: conversationsLoading, error: conversationsError, refetch: refetchConversations } = useConversations();
  const { messages, loading: messagesLoading, error: messagesError, sendMessage, refetch: refetchMessages } = useMessages(activeConversation);

  // Auto-open or create conversation when navigated from "Hubungi" button
  useEffect(() => {
    const therapistId = searchParams.get('therapistId');
    const childId = searchParams.get('childId');
    if (!therapistId || conversationsLoading || autoStartRef.current) return;

    autoStartRef.current = true;

    // Check if a conversation with this therapist already exists
    const existing = conversations.find((conv: any) =>
      conv.participants?.some((p: any) => p.userId?._id === therapistId || p.userId === therapistId)
    );

    if (existing) {
      setActiveConversation(existing._id);
    } else {
      // Create a new conversation
      (async () => {
        const token = localStorage.getItem('token');
        const body: any = { participantIds: [user!._id, therapistId], type: 'direct' };
        if (childId) body.childId = childId;
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        const result = await res.json();
        if (result.success) {
          await refetchConversations();
          setActiveConversation(result.data.conversation._id);
        }
      })();
    }
  }, [searchParams, conversations, conversationsLoading]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const activeConv = conversations.find(conv => conv._id === activeConversation);

  const getOtherParticipant = (conversation: any) => {
    if (!user || !conversation?.participants) return null;
    return conversation.participants.find((p: any) =>
      p.userId._id !== user._id && p.isActive
    );
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sendingMessage || !activeConversation) return;

    setSendingMessage(true);
    const success = await sendMessage(messageText.trim());

    if (success) {
      setMessageText("");
      refetchConversations();
    }
    setSendingMessage(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const fetchContacts = async () => {
    setLoadingContacts(true);
    setNewChatContacts([]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/children?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const children: any[] = data.children || [];

      if (user?.role === 'therapist') {
        // Build list of parents from assigned children
        const seen = new Set<string>();
        const contacts = children
          .filter((c: any) => c.parent?.id)
          .filter((c: any) => {
            if (seen.has(c.parent.id)) return false;
            seen.add(c.parent.id);
            return true;
          })
          .map((c: any) => ({
            userId: c.parent.id,
            userName: c.parent.name,
            childId: c.id,
            childName: c.name,
          }));
        setNewChatContacts(contacts);
      } else if (user?.role === 'parent') {
        // Build list of therapists from children
        const seen = new Set<string>();
        const contacts = children
          .filter((c: any) => c.therapist?.id)
          .filter((c: any) => {
            if (seen.has(c.therapist.id)) return false;
            seen.add(c.therapist.id);
            return true;
          })
          .map((c: any) => ({
            userId: c.therapist.id,
            userName: c.therapist.name,
            childId: c.id,
            childName: c.name,
          }));
        setNewChatContacts(contacts);
      }
    } catch {
      setNewChatContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleStartConversation = async (contact: {
    userId: string; childId?: string;
  }) => {
    setCreatingConversation(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = { participantIds: [user!._id, contact.userId], type: 'direct' };
      if (contact.childId) body.childId = contact.childId;

      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        const convId = result.data.conversation._id;
        setShowNewChatModal(false);
        await refetchConversations();
        setActiveConversation(convId);
      }
    } catch {
      // silently ignore — user stays on modal
    } finally {
      setCreatingConversation(false);
    }
  };

  // Filter conversations based on search and role
  const filteredConversations = conversations.filter(conv => {
    if (!searchText.trim()) return true;

    const otherParticipant = getOtherParticipant(conv);
    const participantName = otherParticipant?.userId?.name || '';
    const childName = conv.childId?.name || '';
    const searchLower = searchText.toLowerCase();

    return participantName.toLowerCase().includes(searchLower) ||
           childName.toLowerCase().includes(searchLower);
  });

  // Role-based page title and description
  const getPageContent = () => {
    switch (user?.role) {
      case 'parent':
        return {
          title: "Pesan",
          description: "Berkomunikasi dengan terapis anak Anda"
        };
      case 'therapist':
        return {
          title: "Pesan Pasien",
          description: "Berkomunikasi dengan orang tua dan pasien Anda"
        };
      case 'admin':
        return {
          title: "Semua Pesan",
          description: "Monitor komunikasi di sistem"
        };
      default:
        return {
          title: "Pesan",
          description: "Komunikasi dalam sistem"
        };
    }
  };

  // Role-based participant label
  const getParticipantLabel = (participant: any) => {
    if (!user) return participant?.userId?.name || 'Tidak Diketahui';

    const participantRole = participant?.role;
    const participantName = participant?.userId?.name || 'Tidak Diketahui';

    switch (user.role) {
      case 'parent':
        return participantRole === 'therapist' ? `Dr. ${participantName}` : participantName;
      case 'therapist':
        return participantRole === 'parent' ? `Orang Tua: ${participantName}` : participantName;
      case 'admin':
        return `${participantName} (${participantRole})`;
      default:
        return participantName;
    }
  };

  const pageContent = getPageContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{pageContent.title}</h1>
        <p className="text-gray-600">{pageContent.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Percakapan</span>
              {(user?.role === 'therapist' || user?.role === 'parent') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowNewChatModal(true); fetchContacts(); }}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Baru
                </Button>
              )}
            </CardTitle>
            <div className="relative">
              <SearchIcon className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
              <Input
                placeholder="Cari percakapan..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {conversationsLoading ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-600">Memuat percakapan...</span>
              </div>
            ) : conversationsError ? (
              <div className="flex items-center justify-center p-8 text-red-600">
                <AlertCircleIcon className="h-5 w-5 mr-2" />
                <span>Error: {conversationsError}</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="space-y-1">
                {filteredConversations.map((conv) => {
                  const otherParticipant = getOtherParticipant(conv);
                  const participantName = getParticipantLabel(otherParticipant);
                  const participantRole = otherParticipant?.role || '';

                  return (
                    <div
                      key={conv._id}
                      onClick={() => setActiveConversation(conv._id)}
                      className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                        activeConversation === conv._id ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              {otherParticipant?.userId?.avatar ? (
                                <img
                                  src={otherParticipant.userId.avatar}
                                  alt={participantName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <UserIcon className="h-5 w-5 text-teal-600" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 truncate">
                              {participantName}
                            </h3>
                            {user?.role === 'admin' && (
                              <p className="text-xs text-gray-500 capitalize">{participantRole}</p>
                            )}
                            {conv.childId?.name && (
                              <p className="text-xs text-teal-600">
                                {user?.role === 'parent' ? `Untuk: ${conv.childId.name}` :
                                 user?.role === 'therapist' ? `Pasien: ${conv.childId.name}` :
                                 `Anak: ${conv.childId.name}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs text-gray-500">
                            {conv.lastMessage ? formatTime(conv.lastMessage.sentAt) : ''}
                          </span>
                          {conv.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs px-2 py-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {conv.lastMessage?.content || 'Belum ada pesan'}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Belum ada percakapan</p>
                <p className="text-sm">
                  {user?.role === 'therapist'
                    ? 'Klik "+ Baru" untuk mulai chat dengan orang tua pasien Anda'
                    : user?.role === 'parent'
                    ? 'Klik "+ Baru" untuk mulai chat dengan terapis anak Anda'
                    : 'Belum ada percakapan dalam sistem'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2 flex flex-col">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      {getOtherParticipant(activeConv)?.userId?.avatar ? (
                        <img
                          src={getOtherParticipant(activeConv)?.userId?.avatar}
                          alt={getOtherParticipant(activeConv)?.userId?.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <UserIcon className="h-5 w-5 text-teal-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getParticipantLabel(getOtherParticipant(activeConv))}
                    </h3>
                    {user?.role === 'admin' && (
                      <p className="text-sm text-gray-500 capitalize">
                        {getOtherParticipant(activeConv)?.role || ''}
                      </p>
                    )}
                    {activeConv.childId?.name && (
                      <p className="text-sm text-teal-600">
                        {user?.role === 'parent' ? `Terapis untuk ${activeConv.childId.name}` :
                         user?.role === 'therapist' ? `Pasien: ${activeConv.childId.name}` :
                         `Diskusi tentang: ${activeConv.childId.name}`}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                    <span className="ml-2 text-gray-600">Memuat pesan...</span>
                  </div>
                ) : messagesError ? (
                  <div className="flex items-center justify-center py-8 text-red-600">
                    <AlertCircleIcon className="h-5 w-5 mr-2" />
                    <span>Error: {messagesError}</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message) => {
                    const isMyMessage = message.senderId._id === user?._id;

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isMyMessage
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMyMessage ? 'text-teal-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.sentAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Belum ada pesan</p>
                    <p className="text-sm">Mulai percakapan dengan mengirim pesan</p>
                  </div>
                )}
              </CardContent>

              {/* Message Input */}
              {user?.role !== 'admin' && (
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Ketik pesan..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sendingMessage}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                    >
                      {sendingMessage ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <SendIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquareIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Pilih percakapan untuk mulai {user?.role === 'admin' ? 'melihat' : 'mengirim'} pesan</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Conversation Modal */}
      {showNewChatModal && (
        <Dialog open onOpenChange={(o) => !o && setShowNewChatModal(false)}>
          <DialogContent size="sm">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>
                  {user?.role === 'therapist' ? 'Chat dengan Orang Tua Pasien' : 'Chat dengan Terapis'}
                </DialogTitle>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            {loadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-500 text-sm">Memuat kontak...</span>
              </div>
            ) : newChatContacts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {user?.role === 'therapist'
                  ? 'Belum ada pasien yang ditugaskan ke Anda.'
                  : 'Belum ada terapis yang ditugaskan untuk anak Anda.'}
              </p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto mt-2">
                {newChatContacts.map((contact, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 text-left transition-colors disabled:opacity-50"
                    onClick={() => handleStartConversation(contact)}
                    disabled={creatingConversation}
                  >
                    <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{contact.userName}</p>
                      {contact.childName && (
                        <p className="text-xs text-gray-500 truncate">
                          {user?.role === 'therapist'
                            ? `Orang tua dari ${contact.childName}`
                            : `Terapis ${contact.childName}`}
                        </p>
                      )}
                    </div>
                    {creatingConversation && (
                      <LoadingSpinner size="sm" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
