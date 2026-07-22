"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import {
  SendIcon,
  PaperclipIcon,
  SmileIcon,
  VideoIcon,
  PhoneIcon,
  MoreVerticalIcon,
  ReplyIcon,
  EditIcon,
  TrashIcon,
  DownloadIcon,
  ImageIcon,
  FileIcon,
  MicIcon,
  XIcon
} from "lucide-react";

interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  messageType: "text" | "image" | "video" | "audio" | "document" | "system";
  attachments: {
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }[];
  replyTo?: string;
  reactions: {
    userId: string;
    emoji: string;
    createdAt: string;
  }[];
  status: "sent" | "delivered" | "read";
  readBy: {
    userId: string;
    readAt: string;
  }[];
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
}

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
  lastSeen?: string;
}

interface ChatWindowProps {
  conversation: IConversation;
  messages: IMessage[];
  users: IUser[];
  currentUserId: string;
  onSendMessage: (message: {
    content?: string;
    messageType: IMessage["messageType"];
    attachments?: File[];
    replyTo?: string;
  }) => Promise<void>;
  onStartVideoCall?: () => Promise<void>;
  onEditMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onReactToMessage?: (messageId: string, emoji: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChatWindow({
  conversation,
  messages,
  users,
  currentUserId,
  onSendMessage,
  onStartVideoCall,
  onEditMessage,
  onDeleteMessage,
  onReactToMessage,
  isLoading = false
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when replying
  useEffect(() => {
    if (replyingTo && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [replyingTo]);

  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants
      .filter(p => p.userId !== currentUserId)
      .map(p => users.find(u => u._id === p.userId))
      .filter(Boolean);

    if (otherParticipants.length === 1) return otherParticipants[0]!.name;
    if (otherParticipants.length === 2) return `${otherParticipants[0]!.name}, ${otherParticipants[1]!.name}`;
    return `${otherParticipants[0]!.name} & ${otherParticipants.length - 1} others`;
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && attachments.length === 0) || isLoading) return;

    const messageType: IMessage["messageType"] = 
      attachments.length > 0 
        ? attachments[0].type.startsWith("image/") ? "image" 
          : attachments[0].type.startsWith("video/") ? "video"
          : attachments[0].type.startsWith("audio/") ? "audio"
          : "document"
        : "text";

    try {
      await onSendMessage({
        content: messageText.trim() || undefined,
        messageType,
        attachments: attachments.length > 0 ? attachments : undefined,
        replyTo: replyingTo?._id
      });

      // Reset form
      setMessageText("");
      setAttachments([]);
      setReplyingTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      addToast({
        title: "Gagal mengirim pesan",
        description: "Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(files);
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      await onEditMessage?.(editingMessage._id, editText.trim());
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      addToast({
        title: "Gagal mengedit pesan",
        description: "Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return `Kemarin ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Byte";
    const k = 1024;
    const sizes = ["Byte", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getUserInfo = (userId: string) => {
    return users.find(u => u._id === userId);
  };

  const getMessagesByDate = () => {
    const messagesByDate: { [date: string]: IMessage[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.sentAt).toDateString();
      if (!messagesByDate[date]) {
        messagesByDate[date] = [];
      }
      messagesByDate[date].push(message);
    });
    
    return messagesByDate;
  };

  const messagesByDate = getMessagesByDate();

  const commonEmojis = ["👍", "❤️", "😊", "😂", "😮", "😢", "👏", "🙏"];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <Card className="rounded-b-none">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar size="md">
                {conversation.type === "direct" && conversation.participants.length === 2 ? (
                  <>
                    {(() => {
                      const otherUser = conversation.participants.find(p => p.userId !== currentUserId);
                      const user = otherUser ? users.find(u => u._id === otherUser.userId) : null;
                      return user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      ) : (
                        <AvatarFallback>
                          {user?.name.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                        </AvatarFallback>
                      );
                    })()}
                  </>
                ) : (
                  <AvatarFallback className="bg-green-100 text-teal-700">
                    {getConversationTitle().split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">{getConversationTitle()}</CardTitle>
                <p className="text-sm text-gray-600">
                  {conversation.type === "direct" && conversation.participants.length === 2 ? (
                    <>
                      {(() => {
                        const otherUser = conversation.participants.find(p => p.userId !== currentUserId);
                        const user = otherUser ? users.find(u => u._id === otherUser.userId) : null;
                        return user?.isOnline ? "Online" : user?.lastSeen ? `Terakhir dilihat ${formatMessageTime(user.lastSeen)}` : "Offline";
                      })()}
                    </>
                  ) : (
                    `${conversation.participants.length} anggota`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {conversation.settings.allowVideoCall && onStartVideoCall && (
                <Button variant="ghost" size="sm" onClick={onStartVideoCall}>
                  <VideoIcon size={20} />
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <MoreVerticalIcon size={20} />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messagesByDate).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="text-center my-4">
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {new Date(date).toLocaleDateString() === new Date().toLocaleDateString() 
                  ? "Hari ini"
                  : new Date(date).toLocaleDateString() === new Date(Date.now() - 86400000).toLocaleDateString()
                  ? "Kemarin"
                  : new Date(date).toLocaleDateString()}
              </span>
            </div>

            {/* Messages for this date */}
            {dayMessages.map((message, index) => {
              const sender = getUserInfo(message.senderId);
              const isMe = message.senderId === currentUserId;
              const showAvatar = !isMe && (
                index === 0 || 
                dayMessages[index - 1].senderId !== message.senderId ||
                new Date(message.sentAt).getTime() - new Date(dayMessages[index - 1].sentAt).getTime() > 300000 // 5 minutes
              );

              return (
                <div key={message._id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
                  <div className={`flex max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    {!isMe && (
                      <Avatar size="sm" className={`${showAvatar ? "opacity-100" : "opacity-0"} mr-2`}>
                        {sender?.avatar ? (
                          <AvatarImage src={sender.avatar} alt={sender.name} />
                        ) : (
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {sender?.name.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}

                    {/* Message content */}
                    <div className={`${isMe ? "ml-2" : ""}`}>
                      {/* Sender name (for group chats) */}
                      {!isMe && conversation.type !== "direct" && showAvatar && (
                        <p className="text-xs text-gray-600 mb-1 ml-3">{sender?.name}</p>
                      )}

                      {/* Reply indicator */}
                      {message.replyTo && (
                        <div className={`text-xs text-gray-500 mb-1 ${isMe ? "text-right" : "text-left"}`}>
                          <ReplyIcon size={12} className="inline mr-1" />
                          Membalas {(() => {
                            const replyMessage = messages.find(m => m._id === message.replyTo);
                            const replySender = replyMessage ? getUserInfo(replyMessage.senderId) : null;
                            return replySender?._id === currentUserId ? "Anda sendiri" : replySender?.name || "someone";
                          })()}
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`relative rounded-lg px-3 py-2 ${
                          isMe
                            ? "bg-teal-700 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                        onMouseEnter={() => setShowEmojiPicker(message._id)}
                        onMouseLeave={() => setShowEmojiPicker(null)}
                      >
                        {/* Message content */}
                        {message.messageType === "text" && (
                          <div>
                            {editingMessage?._id === message._id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full p-2 text-gray-900 bg-white rounded"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleEditMessage}>Simpan</Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setEditingMessage(null)}
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                          </div>
                        )}

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, i) => (
                              <div key={i}>
                                {attachment.mimeType.startsWith("image/") && (
                                  <img
                                    src={attachment.url}
                                    alt={attachment.originalName}
                                    className="max-w-full rounded cursor-pointer"
                                    onClick={() => window.open(attachment.url, "_blank")}
                                  />
                                )}
                                
                                {attachment.mimeType.startsWith("video/") && (
                                  <video
                                    src={attachment.url}
                                    controls
                                    className="max-w-full rounded"
                                  />
                                )}
                                
                                {!attachment.mimeType.startsWith("image/") && !attachment.mimeType.startsWith("video/") && (
                                  <div className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded">
                                    <FileIcon size={16} />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{attachment.originalName}</p>
                                      <p className="text-xs opacity-75">{formatFileSize(attachment.size)}</p>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(attachment.url, "_blank")}
                                    >
                                      <DownloadIcon size={14} />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message timestamp and status */}
                        <div className={`flex items-center justify-between mt-2 text-xs ${
                          isMe ? "text-teal-100" : "text-gray-500"
                        }`}>
                          <span>{formatMessageTime(message.sentAt)}</span>
                          {message.editedAt && <span className="italic">(diedit)</span>}
                          {isMe && (
                            <span>
                              {message.status === "sent" && "✓"}
                              {message.status === "delivered" && "✓✓"}
                              {message.status === "read" && (
                                <span className="text-teal-200">✓✓</span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(() => {
                              const reactionGroups: { [emoji: string]: string[] } = {};
                              message.reactions.forEach(reaction => {
                                if (!reactionGroups[reaction.emoji]) {
                                  reactionGroups[reaction.emoji] = [];
                                }
                                reactionGroups[reaction.emoji].push(reaction.userId);
                              });
                              
                              return Object.entries(reactionGroups).map(([emoji, userIds]) => (
                                <button
                                  key={emoji}
                                  className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs"
                                  onClick={() => onReactToMessage?.(message._id, emoji)}
                                >
                                  {emoji} {userIds.length}
                                </button>
                              ));
                            })()}
                          </div>
                        )}

                        {/* Message actions */}
                        {showEmojiPicker === message._id && isMe && (
                          <div className="absolute -top-8 right-0 flex bg-white shadow-lg rounded-lg p-1 border">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMessage(message);
                                setEditText(message.content || "");
                              }}
                            >
                              <EditIcon size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReplyingTo(message)}
                            >
                              <ReplyIcon size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteMessage?.(message._id)}
                            >
                              <TrashIcon size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-teal-50 border-l-4 border-teal-500 flex items-center justify-between">
          <div>
            <p className="text-sm text-teal-800">
              Membalas {replyingTo.senderId === currentUserId ? "Anda sendiri" : getUserInfo(replyingTo.senderId)?.name}
            </p>
            <p className="text-xs text-teal-600 truncate max-w-md">
              {replyingTo.content || "Lampiran"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(null)}
          >
            <XIcon size={16} />
          </Button>
        </div>
      )}

      {/* Attachment preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-l-4 border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Lampiran ({attachments.length})</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttachments([])}
            >
              <XIcon size={16} />
            </Button>
          </div>
          <div className="space-y-1">
            {attachments.map((file, i) => (
              <div key={i} className="text-xs text-gray-600 flex items-center gap-2">
                {file.type.startsWith("image/") ? <ImageIcon size={12} /> : <FileIcon size={12} />}
                <span>{file.name}</span>
                <span>({formatFileSize(file.size)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ketik pesan..."
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 max-h-32"
              rows={1}
              style={{ 
                minHeight: "40px",
                height: `${Math.min(Math.max(40, messageText.split('\n').length * 20), 120)}px`
              }}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-1">
            {conversation.settings.allowFileSharing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <PaperclipIcon size={20} />
                </Button>
              </>
            )}

            <Button
              onClick={handleSendMessage}
              disabled={(!messageText.trim() && attachments.length === 0) || isLoading}
              size="sm"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : <SendIcon size={20} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}