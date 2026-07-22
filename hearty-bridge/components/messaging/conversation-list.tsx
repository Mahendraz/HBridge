"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageCircleIcon,
  SearchIcon,
  PlusIcon,
  UsersIcon,
  UserIcon,
  VideoIcon,
  PhoneIcon,
  MoreHorizontalIcon,
  FilterIcon
} from "lucide-react";

interface IConversation {
  _id: string;
  participants: {
    userId: string;
    role: "parent" | "therapist" | "family";
    joinedAt: string;
    leftAt?: string;
  }[];
  childId?: string;
  type: "direct" | "group" | "support";
  title?: string;
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: string;
  };
  lastActivity: string;
  isActive: boolean;
  unreadCount: number;
  settings: {
    allowFileSharing: boolean;
    allowVideoCall: boolean;
    messageRetention: number;
  };
}

interface IUser {
  _id: string;
  name: string;
  email: string;
  role: "parent" | "therapist" | "admin";
  avatar?: string;
  isOnline?: boolean;
}

interface ConversationListProps {
  conversations: IConversation[];
  users: IUser[];
  currentUserId: string;
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (participants: string[], type: IConversation["type"], title?: string) => Promise<void>;
  onArchiveConversation?: (conversationId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  users,
  currentUserId,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  onArchiveConversation,
  isLoading = false
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | IConversation["type"]>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const searchMatch = !searchTerm || 
        conversation.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conversation.participants.some(p => {
          const user = users.find(u => u._id === p.userId);
          return user?.name.toLowerCase().includes(searchTerm.toLowerCase());
        }) ||
        conversation.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());

      const typeMatch = selectedType === "all" || conversation.type === selectedType;
      const unreadMatch = !showUnreadOnly || conversation.unreadCount > 0;

      return searchMatch && typeMatch && unreadMatch;
    });
  }, [conversations, users, searchTerm, selectedType, showUnreadOnly]);

  const getConversationTitle = (conversation: IConversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants
      .filter(p => p.userId !== currentUserId)
      .map(p => users.find(u => u._id === p.userId))
      .filter(Boolean);

    if (otherParticipants.length === 0) return "Me";
    if (otherParticipants.length === 1) return otherParticipants[0]!.name;
    if (otherParticipants.length === 2) return `${otherParticipants[0]!.name}, ${otherParticipants[1]!.name}`;
    return `${otherParticipants[0]!.name} & ${otherParticipants.length - 1} others`;
  };

  const getConversationAvatar = (conversation: IConversation) => {
    const otherParticipants = conversation.participants
      .filter(p => p.userId !== currentUserId)
      .map(p => users.find(u => u._id === p.userId))
      .filter(Boolean);

    if (otherParticipants.length === 1 && otherParticipants[0]?.avatar) {
      return otherParticipants[0].avatar;
    }
    return null;
  };

  const getConversationInitials = (conversation: IConversation) => {
    const title = getConversationTitle(conversation);
    return title.split(" ").map(word => word[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString();
  };

  const getLastMessagePreview = (conversation: IConversation) => {
    if (!conversation.lastMessage) return "Belum ada pesan";
    
    const sender = users.find(u => u._id === conversation.lastMessage!.senderId);
    const senderName = sender?.name || "Someone";
    const isMe = conversation.lastMessage.senderId === currentUserId;
    
    const content = conversation.lastMessage.content || "Mengirim lampiran";
    const truncatedContent = content.length > 50 ? `${content.slice(0, 50)}...` : content;
    
    return `${isMe ? "You" : senderName}: ${truncatedContent}`;
  };

  const getTypeIcon = (type: IConversation["type"]) => {
    switch (type) {
      case "direct":
        return <UserIcon size={16} />;
      case "group":
        return <UsersIcon size={16} />;
      case "support":
        return <MessageCircleIcon size={16} />;
      default:
        return <MessageCircleIcon size={16} />;
    }
  };

  const getTypeColor = (type: IConversation["type"]) => {
    switch (type) {
      case "direct":
        return "bg-teal-100 text-teal-800";
      case "group":
        return "bg-green-100 text-green-800";
      case "support":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircleIcon size={24} />
              Pesan
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              <PlusIcon size={16} className="mr-2" />
              Chat Baru
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Cari percakapan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Semua Jenis</option>
                <option value="direct">Pesan Langsung</option>
                <option value="group">Obrolan Grup</option>
                <option value="support">Dukungan</option>
              </select>

              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              >
                <FilterIcon size={16} className="mr-2" />
                Belum Dibaca
              </Button>

              {(searchTerm || selectedType !== "all" || showUnreadOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("all");
                    setShowUnreadOnly(false);
                  }}
                  className="text-xs"
                >
                  Hapus Filter
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{filteredConversations.length} percakapan</span>
              {conversations.some(c => c.unreadCount > 0) && (
                <span>{conversations.filter(c => c.unreadCount > 0).length} belum dibaca</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversations List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircleIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              {conversations.length === 0 ? "Belum ada percakapan" : "Percakapan tidak ditemukan"}
            </h4>
            <p className="text-gray-500 mb-4">
              {conversations.length === 0 
                ? "Mulai percakapan pertama Anda untuk terhubung dengan tim terapi."
                : "Coba sesuaikan pencarian atau filter untuk menemukan yang dicari."}
            </p>
            {conversations.length === 0 && (
              <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                <PlusIcon size={16} className="mr-2" />
                Mulai Percakapan Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => {
            const isActive = conversation._id === activeConversationId;
            const avatar = getConversationAvatar(conversation);

            return (
              <Card
                key={conversation._id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  isActive ? "border-teal-500 bg-teal-50" : ""
                }`}
                onClick={() => onSelectConversation(conversation._id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar size="md">
                        {avatar ? (
                          <AvatarImage src={avatar} alt="" />
                        ) : (
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {getConversationInitials(conversation)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {/* Online status for direct messages */}
                      {conversation.type === "direct" && (
                        <>
                          {conversation.participants
                            .filter(p => p.userId !== currentUserId)
                            .map(p => users.find(u => u._id === p.userId))
                            .some(user => user?.isOnline) && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">
                            {getConversationTitle(conversation)}
                          </h4>
                          <Badge className={`${getTypeColor(conversation.type)} text-xs px-1.5 py-0.5`}>
                            {getTypeIcon(conversation.type)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="bg-green-600 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(conversation.lastActivity)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {getLastMessagePreview(conversation)}
                        </p>
                        
                        <div className="flex items-center gap-1 ml-2">
                          {conversation.settings.allowVideoCall && (
                            <VideoIcon size={14} className="text-gray-500" />
                          )}
                          {conversation.settings.allowFileSharing && (
                            <PhoneIcon size={14} className="text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* More options */}
                    {onArchiveConversation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add context menu or archive action
                        }}
                      >
                        <MoreHorizontalIcon size={16} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Conversation Dialog */}
      <CreateConversationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        users={users.filter(u => u._id !== currentUserId)}
        onCreateConversation={onCreateConversation}
      />
    </div>
  );
}

// Create Conversation Dialog
function CreateConversationDialog({
  open,
  onOpenChange,
  users,
  onCreateConversation
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: IUser[];
  onCreateConversation: (participants: string[], type: IConversation["type"], title?: string) => Promise<void>;
}) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [conversationType, setConversationType] = useState<IConversation["type"]>("direct");
  const [groupTitle, setGroupTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    const title = conversationType === "group" && groupTitle.trim() ? groupTitle.trim() : undefined;
    await onCreateConversation(selectedUsers, conversationType, title);
    
    // Reset form
    setSelectedUsers([]);
    setConversationType("direct");
    setGroupTitle("");
    setSearchTerm("");
    onOpenChange(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Mulai Percakapan Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conversation Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Jenis Percakapan</label>
            <select
              value={conversationType}
              onChange={(e) => {
                setConversationType(e.target.value as IConversation["type"]);
                if (e.target.value === "direct") {
                  setSelectedUsers(prev => prev.slice(0, 1));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="direct">Pesan Langsung</option>
              <option value="group">Obrolan Grup</option>
              <option value="support">Chat Dukungan</option>
            </select>
          </div>

          {/* Group Title (only for group chats) */}
          {conversationType === "group" && (
            <div>
              <label className="block text-sm font-medium mb-2">Nama Grup (opsional)</label>
              <Input
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Masukkan nama grup..."
              />
            </div>
          )}

          {/* User Search */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Pilih {conversationType === "direct" ? "Orang" : "Orang"} untuk Mengobrol
            </label>
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Cari pengguna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Dipilih:</label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(userId => {
                  const user = users.find(u => u._id === userId);
                  return (
                    <Badge
                      key={userId}
                      variant="secondary"
                      className="flex items-center gap-1 py-1"
                    >
                      {user?.name}
                      <button
                        onClick={() => toggleUserSelection(userId)}
                        className="ml-1 hover:bg-gray-200 rounded-full"
                      >
                        ×
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* User List */}
          <div className="max-h-60 overflow-y-auto border rounded-md">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? "Pengguna tidak ditemukan" : "Tidak ada pengguna tersedia"}
              </div>
            ) : (
              filteredUsers.map(user => {
                const isSelected = selectedUsers.includes(user._id);
                const canSelect = conversationType !== "direct" || selectedUsers.length === 0 || isSelected;

                return (
                  <div
                    key={user._id}
                    className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                      isSelected ? "bg-teal-50" : canSelect ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => canSelect && toggleUserSelection(user._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar size="sm">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : (
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                      </div>
                      
                      {isSelected && (
                        <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0}
          >
            Mulai Percakapan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}