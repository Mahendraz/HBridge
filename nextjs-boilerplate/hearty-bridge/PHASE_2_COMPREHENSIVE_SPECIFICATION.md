# Phase 2: Comprehensive Technical Specification
## Hearty Bridge Enhancement Features

### Table of Contents
1. [Database Schema Updates](#1-database-schema-updates)
2. [API Endpoint Specifications](#2-api-endpoint-specifications) 
3. [Frontend Component Architecture](#3-frontend-component-architecture)
4. [File Storage Strategy](#4-file-storage-strategy)
5. [Real-time Communication Design](#5-real-time-communication-design)
6. [Performance Optimization Approach](#6-performance-optimization-approach)
7. [Testing Procedures](#7-testing-procedures)
8. [Implementation Timeline](#8-implementation-timeline)

---

## 1. Database Schema Updates

### 1.1 Enhanced Child Profile Schema
```typescript
// Extended IChild interface
interface IChildExtended extends IChild {
  profile: {
    avatar?: string;
    photos: IMediaFile[];
    videos: IMediaFile[];
    documents: IDocument[];
    milestones: IMilestone[];
    preferences: {
      favoriteActivities: string[];
      dislikes: string[];
      communicationStyle: 'verbal' | 'non-verbal' | 'mixed';
      sensoryNeeds: string[];
    };
  };
  familyConnections: {
    parents: mongoose.Types.ObjectId[];
    siblings: mongoose.Types.ObjectId[];
    extendedFamily: IFamilyMember[];
  };
}

interface IMediaFile {
  _id: mongoose.Types.ObjectId;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  tags: string[];
  description?: string;
  isPublic: boolean;
}

interface IDocument {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: 'medical' | 'educational' | 'legal' | 'other';
  fileUrl: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  expiryDate?: Date;
  tags: string[];
  isConfidential: boolean;
  accessLevel: 'parent-only' | 'therapist-only' | 'shared';
}

interface IMilestone {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  achievedDate?: Date;
  targetDate?: Date;
  category: 'physical' | 'cognitive' | 'social' | 'emotional' | 'communication';
  status: 'not-started' | 'in-progress' | 'achieved' | 'deferred';
  notes: string;
  attachments: IMediaFile[];
}
```

### 1.2 Family Tree Schema
```typescript
interface IFamily extends Document {
  _id: mongoose.Types.ObjectId;
  familyName: string;
  primaryParents: mongoose.Types.ObjectId[];
  children: mongoose.Types.ObjectId[];
  extendedMembers: IFamilyMember[];
  familyTree: IFamilyTreeNode[];
  settings: {
    visibility: 'private' | 'therapist-visible' | 'public';
    allowMemberInvites: boolean;
    requireApproval: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IFamilyMember {
  userId?: mongoose.Types.ObjectId;
  name: string;
  relationship: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  role: 'caregiver' | 'emergency-contact' | 'family' | 'support';
  permissions: string[];
  isActive: boolean;
  invitedAt?: Date;
  joinedAt?: Date;
}

interface IFamilyTreeNode {
  memberId: string;
  name: string;
  relationship: string;
  generation: number;
  parentIds: string[];
  avatar?: string;
  isDeceased: boolean;
  birthYear?: number;
  notes?: string;
}
```

### 1.3 Messaging & Communication Schema
```typescript
interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  participants: {
    userId: mongoose.Types.ObjectId;
    role: 'parent' | 'therapist' | 'family';
    joinedAt: Date;
    leftAt?: Date;
  }[];
  childId?: mongoose.Types.ObjectId;
  type: 'direct' | 'group' | 'support';
  title?: string;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  isActive: boolean;
  settings: {
    allowFileSharing: boolean;
    allowVideoCall: boolean;
    messageRetention: number; // days
  };
  createdAt: Date;
  updatedAt: Date;
}

interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system';
  attachments: IMediaFile[];
  replyTo?: mongoose.Types.ObjectId;
  reactions: {
    userId: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }[];
  status: 'sent' | 'delivered' | 'read';
  readBy: {
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }[];
  isEncrypted: boolean;
  sentAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
}

interface IVideoCall extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  initiatorId: mongoose.Types.ObjectId;
  participants: {
    userId: mongoose.Types.ObjectId;
    joinedAt?: Date;
    leftAt?: Date;
    duration: number;
  }[];
  roomId: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  scheduledFor?: Date;
  startedAt?: Date;
  endedAt?: Date;
  duration: number; // seconds
  recordingUrl?: string;
  notes?: string;
  createdAt: Date;
}
```

### 1.4 Search & Analytics Schema
```typescript
interface ISearchIndex extends Document {
  _id: mongoose.Types.ObjectId;
  entityType: 'child' | 'user' | 'document' | 'message';
  entityId: mongoose.Types.ObjectId;
  content: string;
  tags: string[];
  metadata: Record<string, any>;
  permissions: {
    viewableBy: mongoose.Types.ObjectId[];
    roles: ('parent' | 'therapist' | 'family')[];
  };
  lastIndexed: Date;
  createdAt: Date;
}

interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

---

## 2. API Endpoint Specifications

### 2.1 Enhanced Child Profile APIs

#### GET /api/children/[id]/profile
**Description**: Get comprehensive child profile including media and documents
```typescript
// Response Schema
interface ChildProfileResponse extends ApiResponse {
  data: {
    child: IChildExtended;
    mediaStats: {
      photoCount: number;
      videoCount: number;
      documentCount: number;
      totalStorageUsed: number;
    };
    recentActivity: IActivityLog[];
  };
}

// Query Parameters
interface ChildProfileQuery {
  include?: ('media' | 'documents' | 'milestones' | 'family')[];
  limit?: number;
  offset?: number;
}
```

#### PUT /api/children/[id]/profile
**Description**: Update child profile information
```typescript
// Request Body
interface UpdateChildProfileRequest {
  profile?: Partial<IChildExtended['profile']>;
  familyConnections?: Partial<IChildExtended['familyConnections']>;
}

// Response
interface UpdateChildProfileResponse extends ApiResponse {
  data: IChildExtended;
}
```

#### POST /api/children/[id]/media
**Description**: Upload media files for child profile
```typescript
// Request Body (multipart/form-data)
interface UploadMediaRequest {
  files: File[];
  type: 'photo' | 'video';
  tags?: string[];
  description?: string;
  isPublic?: boolean;
}

// Response
interface UploadMediaResponse extends ApiResponse {
  data: {
    uploadedFiles: IMediaFile[];
    failedFiles: {
      fileName: string;
      error: string;
    }[];
  };
}
```

### 2.2 Family Tree APIs

#### GET /api/families/[id]/tree
**Description**: Get family tree structure and visualization data
```typescript
interface FamilyTreeResponse extends ApiResponse {
  data: {
    family: IFamily;
    treeData: {
      nodes: IFamilyTreeNode[];
      edges: {
        source: string;
        target: string;
        relationship: string;
      }[];
    };
    permissions: {
      canEdit: boolean;
      canInvite: boolean;
      canView: string[];
    };
  };
}
```

#### POST /api/families/[id]/members
**Description**: Add family member to tree
```typescript
interface AddFamilyMemberRequest {
  member: Omit<IFamilyMember, '_id' | 'joinedAt'>;
  treePosition: {
    parentIds: string[];
    generation: number;
    relationship: string;
  };
  sendInvitation?: boolean;
}

interface AddFamilyMemberResponse extends ApiResponse {
  data: {
    member: IFamilyMember;
    invitationSent: boolean;
  };
}
```

### 2.3 Real-time Communication APIs

#### GET /api/conversations
**Description**: Get user's conversations with pagination and filters
```typescript
interface GetConversationsQuery {
  type?: 'direct' | 'group' | 'support';
  childId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ConversationsResponse extends PaginatedResponse<IConversation> {
  data: (IConversation & {
    unreadCount: number;
    lastMessagePreview: string;
  })[];
}
```

#### POST /api/conversations
**Description**: Create new conversation
```typescript
interface CreateConversationRequest {
  participants: string[];
  childId?: string;
  type: 'direct' | 'group' | 'support';
  title?: string;
  settings?: Partial<IConversation['settings']>;
}

interface CreateConversationResponse extends ApiResponse {
  data: IConversation;
}
```

#### POST /api/conversations/[id]/messages
**Description**: Send message to conversation
```typescript
interface SendMessageRequest {
  content?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document';
  attachments?: File[];
  replyTo?: string;
}

interface SendMessageResponse extends ApiResponse {
  data: IMessage;
}
```

#### POST /api/video-calls/initiate
**Description**: Initiate video call
```typescript
interface InitiateCallRequest {
  conversationId: string;
  participants: string[];
  scheduledFor?: string; // ISO date
}

interface InitiateCallResponse extends ApiResponse {
  data: {
    call: IVideoCall;
    roomToken: string;
    roomUrl: string;
  };
}
```

### 2.4 Document Management APIs

#### GET /api/documents
**Description**: Get documents with advanced filtering
```typescript
interface GetDocumentsQuery {
  childId?: string;
  type?: 'medical' | 'educational' | 'legal' | 'other';
  tags?: string;
  search?: string;
  expiringInDays?: number;
  accessLevel?: 'parent-only' | 'therapist-only' | 'shared';
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'title' | 'expiryDate';
  sortOrder?: 'asc' | 'desc';
}

interface DocumentsResponse extends PaginatedResponse<IDocument> {
  data: (IDocument & {
    uploaderName: string;
    isExpiring: boolean;
    daysUntilExpiry?: number;
  })[];
}
```

#### POST /api/documents/upload
**Description**: Upload document with metadata
```typescript
interface UploadDocumentRequest {
  file: File;
  title: string;
  type: 'medical' | 'educational' | 'legal' | 'other';
  childId?: string;
  expiryDate?: string;
  tags: string[];
  isConfidential: boolean;
  accessLevel: 'parent-only' | 'therapist-only' | 'shared';
}

interface UploadDocumentResponse extends ApiResponse {
  data: IDocument;
}
```

### 2.5 Advanced Search APIs

#### GET /api/search
**Description**: Global search across all entities
```typescript
interface GlobalSearchQuery {
  q: string;
  types?: ('children' | 'users' | 'documents' | 'messages')[];
  childId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string;
  page?: number;
  limit?: number;
}

interface SearchResponse extends PaginatedResponse<any> {
  data: {
    type: string;
    entity: any;
    highlights: string[];
    relevanceScore: number;
  }[];
  facets: {
    types: Record<string, number>;
    tags: Record<string, number>;
    users: Record<string, number>;
  };
}
```

---

## 3. Frontend Component Architecture

### 3.1 Enhanced Child Profile Components

```typescript
// components/child-profile/ChildProfileLayout.tsx
interface ChildProfileLayoutProps {
  child: IChildExtended;
  activeTab: 'overview' | 'media' | 'documents' | 'milestones' | 'family';
  onTabChange: (tab: string) => void;
}

// components/child-profile/MediaGallery.tsx
interface MediaGalleryProps {
  childId: string;
  type: 'photos' | 'videos' | 'all';
  canUpload: boolean;
  onUpload: (files: File[]) => Promise<void>;
}

// components/child-profile/DocumentManager.tsx
interface DocumentManagerProps {
  childId: string;
  documents: IDocument[];
  canUpload: boolean;
  canDelete: boolean;
  onUpload: (document: UploadDocumentRequest) => Promise<void>;
}

// components/child-profile/MilestoneTracker.tsx
interface MilestoneTrackerProps {
  childId: string;
  milestones: IMilestone[];
  canEdit: boolean;
  onUpdateMilestone: (milestone: Partial<IMilestone>) => Promise<void>;
}
```

### 3.2 Family Tree Components

```typescript
// components/family-tree/FamilyTreeVisualization.tsx
interface FamilyTreeProps {
  family: IFamily;
  canEdit: boolean;
  onAddMember: (member: IFamilyMember) => Promise<void>;
  onEditMember: (memberId: string, updates: Partial<IFamilyMember>) => Promise<void>;
}

// components/family-tree/TreeNode.tsx
interface TreeNodeProps {
  member: IFamilyTreeNode;
  isSelected: boolean;
  canEdit: boolean;
  onClick: () => void;
  onEdit: (updates: Partial<IFamilyTreeNode>) => void;
}

// components/family-tree/AddMemberModal.tsx
interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: IFamilyMember) => Promise<void>;
  availableRelationships: string[];
}
```

### 3.3 Real-time Communication Components

```typescript
// components/messaging/ConversationList.tsx
interface ConversationListProps {
  conversations: IConversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
}

// components/messaging/ChatWindow.tsx
interface ChatWindowProps {
  conversation: IConversation;
  messages: IMessage[];
  currentUserId: string;
  onSendMessage: (message: SendMessageRequest) => Promise<void>;
  onStartVideoCall: () => Promise<void>;
}

// components/messaging/VideoCallWindow.tsx
interface VideoCallWindowProps {
  call: IVideoCall;
  roomToken: string;
  onEndCall: () => Promise<void>;
  onToggleMute: () => void;
  onToggleVideo: () => void;
}
```

### 3.4 Document Management Components

```typescript
// components/documents/DocumentLibrary.tsx
interface DocumentLibraryProps {
  documents: IDocument[];
  filters: GetDocumentsQuery;
  onFilterChange: (filters: Partial<GetDocumentsQuery>) => void;
  onUpload: (document: UploadDocumentRequest) => Promise<void>;
}

// components/documents/DocumentViewer.tsx
interface DocumentViewerProps {
  document: IDocument;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (updates: Partial<IDocument>) => Promise<void>;
  onDelete: () => Promise<void>;
}

// components/documents/DocumentUploader.tsx
interface DocumentUploaderProps {
  childId?: string;
  onUpload: (document: UploadDocumentRequest) => Promise<void>;
  acceptedTypes: string[];
  maxFileSize: number;
}
```

### 3.5 Search Components

```typescript
// components/search/GlobalSearchBar.tsx
interface GlobalSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Partial<GlobalSearchQuery>) => void;
  placeholder?: string;
}

// components/search/SearchResults.tsx
interface SearchResultsProps {
  results: SearchResponse['data'];
  facets: SearchResponse['facets'];
  loading: boolean;
  onResultClick: (result: any) => void;
}

// components/search/SearchFilters.tsx
interface SearchFiltersProps {
  filters: Partial<GlobalSearchQuery>;
  facets: SearchResponse['facets'];
  onFilterChange: (filters: Partial<GlobalSearchQuery>) => void;
}
```

---

## 4. File Storage Strategy

### 4.1 Storage Architecture

```typescript
// lib/storage/storage-provider.ts
interface StorageProvider {
  uploadFile(file: File, path: string, metadata?: Record<string, any>): Promise<UploadResult>;
  deleteFile(path: string): Promise<void>;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  generateThumbnail(imagePath: string): Promise<string>;
  streamFile(path: string): Promise<ReadableStream>;
}

interface UploadResult {
  url: string;
  path: string;
  size: number;
  mimeType: string;
  checksum: string;
}

// Multi-provider support
class StorageManager {
  private providers: Map<string, StorageProvider> = new Map();
  
  async uploadFile(
    file: File,
    options: {
      provider: 'aws-s3' | 'cloudinary' | 'local';
      generateThumbnail?: boolean;
      quality?: number;
      resize?: { width: number; height: number; };
    }
  ): Promise<UploadResult> {
    // Implementation handles file validation, processing, and upload
  }
}
```

### 4.2 File Organization Structure

```
storage/
├── users/
│   ├── avatars/
│   └── documents/
├── children/
│   ├── {childId}/
│   │   ├── photos/
│   │   │   ├── originals/
│   │   │   └── thumbnails/
│   │   ├── videos/
│   │   │   ├── originals/
│   │   │   └── previews/
│   │   └── documents/
│   │       ├── medical/
│   │       ├── educational/
│   │       └── other/
└── shared/
    ├── temp/
    └── exports/
```

### 4.3 Content Delivery Network (CDN) Integration

```typescript
// lib/storage/cdn-config.ts
interface CDNConfig {
  baseUrl: string;
  regions: string[];
  cacheControl: {
    images: string;
    videos: string;
    documents: string;
  };
  transforms: {
    images: {
      thumbnail: { width: 150, height: 150, quality: 80 };
      medium: { width: 500, height: 500, quality: 90 };
      large: { width: 1200, height: 1200, quality: 95 };
    };
    videos: {
      preview: { duration: 10, quality: 'medium' };
      compressed: { quality: 'low', format: 'mp4' };
    };
  };
}

class CDNManager {
  async getOptimizedUrl(
    originalUrl: string,
    transform: 'thumbnail' | 'medium' | 'large' | 'preview'
  ): Promise<string> {
    // Returns CDN URL with appropriate transformations
  }
}
```

### 4.4 Security & Access Control

```typescript
// lib/storage/security.ts
interface FileAccess {
  checkPermission(
    userId: string,
    filePath: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean>;
  
  generateSecureUrl(
    filePath: string,
    expiresIn: number,
    permissions: string[]
  ): Promise<string>;
}

class FileSecurityManager {
  async encryptSensitiveFile(filePath: string): Promise<string> {
    // Encrypts sensitive documents
  }
  
  async auditFileAccess(
    userId: string,
    filePath: string,
    action: string
  ): Promise<void> {
    // Logs file access for compliance
  }
}
```

---

## 5. Real-time Communication Design

### 5.1 WebSocket Architecture

```typescript
// lib/websocket/websocket-server.ts
interface WebSocketMessage {
  type: 'message' | 'typing' | 'presence' | 'call' | 'notification';
  conversationId?: string;
  payload: any;
  timestamp: number;
  senderId: string;
}

class WebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  
  async joinConversation(userId: string, conversationId: string): Promise<void> {
    // Adds user to conversation room
  }
  
  async broadcastToConversation(
    conversationId: string,
    message: WebSocketMessage,
    excludeUserId?: string
  ): Promise<void> {
    // Sends message to all conversation participants
  }
}

// lib/websocket/message-queue.ts
class MessageQueue {
  async queueMessage(message: IMessage): Promise<void> {
    // Queues message for offline users
  }
  
  async processOfflineMessages(userId: string): Promise<IMessage[]> {
    // Delivers queued messages when user comes online
  }
}
```

### 5.2 Video Call Integration

```typescript
// lib/video/video-service.ts
interface VideoCallService {
  createRoom(callId: string, participants: string[]): Promise<VideoRoom>;
  generateToken(roomId: string, userId: string): Promise<string>;
  endCall(callId: string): Promise<CallStatistics>;
}

interface VideoRoom {
  id: string;
  url: string;
  maxParticipants: number;
  isRecording: boolean;
  settings: {
    enableVideo: boolean;
    enableAudio: boolean;
    enableScreenShare: boolean;
    enableChat: boolean;
  };
}

interface CallStatistics {
  duration: number;
  participants: {
    userId: string;
    joinTime: Date;
    leaveTime?: Date;
    audioQuality: number;
    videoQuality: number;
  }[];
  recordingUrl?: string;
}

// Integration with popular services
class TwilioVideoService implements VideoCallService {
  // Twilio implementation
}

class WebRTCService implements VideoCallService {
  // Pure WebRTC implementation for self-hosted solution
}
```

### 5.3 Push Notifications

```typescript
// lib/notifications/notification-service.ts
interface NotificationService {
  sendPush(
    userId: string,
    notification: PushNotification
  ): Promise<void>;
  
  sendEmail(
    userId: string,
    template: string,
    data: Record<string, any>
  ): Promise<void>;
}

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class NotificationManager {
  async notifyNewMessage(
    conversationId: string,
    senderId: string,
    message: string
  ): Promise<void> {
    // Sends notifications to conversation participants
  }
  
  async notifyDocumentExpiry(
    documentId: string,
    daysUntilExpiry: number
  ): Promise<void> {
    // Notifies users about expiring documents
  }
}
```

---

## 6. Performance Optimization Approach

### 6.1 Database Optimization

```typescript
// Database indexes strategy
const OptimizedIndexes = {
  users: [
    { email: 1 },
    { role: 1, isActive: 1 },
    { createdAt: -1 }
  ],
  children: [
    { parentId: 1, isActive: 1 },
    { therapistId: 1, isActive: 1 },
    { 'profile.preferences.favoriteActivities': 1 }
  ],
  messages: [
    { conversationId: 1, sentAt: -1 },
    { senderId: 1, sentAt: -1 },
    { 'content': 'text' }, // Text search index
  ],
  documents: [
    { childId: 1, type: 1 },
    { expiryDate: 1 },
    { tags: 1 },
    { uploadedAt: -1 }
  ],
  searchIndex: [
    { 'content': 'text' },
    { entityType: 1, entityId: 1 },
    { tags: 1 }
  ]
};

// Query optimization patterns
class QueryOptimizer {
  async getChildProfileOptimized(childId: string): Promise<IChildExtended> {
    // Uses aggregation pipeline for efficient data fetching
    return Child.aggregate([
      { $match: { _id: new ObjectId(childId) } },
      {
        $lookup: {
          from: 'mediafiles',
          localField: '_id',
          foreignField: 'childId',
          as: 'profile.photos',
          pipeline: [
            { $match: { mimeType: /^image\// } },
            { $sort: { uploadedAt: -1 } },
            { $limit: 10 }
          ]
        }
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'childId',
          as: 'profile.documents',
          pipeline: [
            { $sort: { uploadedAt: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);
  }
}
```

### 6.2 Frontend Performance

```typescript
// components/performance/LazyComponents.tsx
// Implement code splitting for large components
const FamilyTreeVisualization = lazy(() => import('./FamilyTreeVisualization'));
const VideoCallWindow = lazy(() => import('./VideoCallWindow'));
const DocumentViewer = lazy(() => import('./DocumentViewer'));

// Virtualization for large lists
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight: number;
}

function VirtualizedList<T>({ items, itemHeight, renderItem, containerHeight }: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length);
  
  const visibleItems = items.slice(startIndex, endIndex);
  
  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 6.3 Caching Strategy

```typescript
// lib/cache/cache-manager.ts
interface CacheManager {
  set(key: string, value: any, ttl?: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  del(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}

class RedisCacheManager implements CacheManager {
  private readonly redis: Redis;
  
  // Cache child profiles for 5 minutes
  async cacheChildProfile(childId: string, profile: IChildExtended): Promise<void> {
    await this.set(`child:${childId}:profile`, profile, 300);
  }
  
  // Cache search results for 10 minutes
  async cacheSearchResults(query: string, results: any): Promise<void> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.set(key, results, 600);
  }
}

// API route caching middleware
function withCache(handler: NextApiHandler, ttl: number = 300): NextApiHandler {
  return async (req, res) => {
    const cacheKey = `api:${req.url}:${JSON.stringify(req.query)}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(cacheKey, data, ttl);
      return originalJson.call(this, data);
    };
    
    return handler(req, res);
  };
}
```

### 6.4 Mobile Responsiveness

```typescript
// styles/responsive-design.ts
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  large: '1440px'
};

const responsiveUtils = {
  // Mobile-first media queries
  mobile: `@media (max-width: ${breakpoints.tablet})`,
  tablet: `@media (min-width: ${breakpoints.tablet}) and (max-width: ${breakpoints.desktop})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  
  // Touch-friendly sizing
  touchTarget: {
    minHeight: '44px',
    minWidth: '44px'
  },
  
  // Adaptive text sizing
  fluidText: (minSize: number, maxSize: number) => `
    font-size: clamp(${minSize}rem, 2.5vw, ${maxSize}rem);
  `
};

// components/mobile/MobileNavigation.tsx
interface MobileNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

function MobileNavigation({ currentPage, onNavigate }: MobileNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navigationItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'flex flex-col items-center py-2 text-xs',
              'min-h-[44px] min-w-[44px]', // Touch-friendly
              currentPage === item.key
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            )}
          >
            <item.icon size={20} />
            <span className="mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
```

---

## 2. API Endpoint Specifications

---

## 7. Testing Procedures

### 7.1 Unit Testing Specifications

```typescript
// tests/models/Child.test.ts
describe('Child Model', () => {
  describe('Profile Management', () => {
    it('should add media files to child profile', async () => {
      // Given
      const child = await Child.create(validChildData);
      const mediaFile: IMediaFile = {
        fileName: 'test-photo.jpg',
        originalName: 'Family Photo.jpg',
        mimeType: 'image/jpeg',
        size: 1024000,
        url: 'https://cdn.example.com/test-photo.jpg',
        uploadedBy: new ObjectId(),
        uploadedAt: new Date(),
        tags: ['family', 'birthday'],
        isPublic: true
      };
      
      // When
      child.profile.photos.push(mediaFile);
      await child.save();
      
      // Then
      const savedChild = await Child.findById(child._id);
      expect(savedChild.profile.photos).toHaveLength(1);
      expect(savedChild.profile.photos[0].tags).toContain('family');
    });
  });
});

// tests/api/conversations.test.ts
describe('/api/conversations', () => {
  describe('POST /api/conversations', () => {
    it('should create conversation with valid participants', async () => {
      // Given
      const parent = await User.create(parentData);
      const therapist = await User.create(therapistData);
      const requestBody = {
        participants: [parent._id.toString(), therapist._id.toString()],
        type: 'direct'
      };
      
      // When
      const response = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestBody);
      
      // Then
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.participants).toHaveLength(2);
    });
  });
});
```

### 7.2 Integration Testing

```typescript
// tests/integration/messaging-flow.test.ts
describe('Messaging Flow Integration', () => {
  it('should handle complete messaging workflow', async () => {
    // Given: Create users and conversation
    const parent = await User.create(parentData);
    const therapist = await User.create(therapistData);
    const conversation = await Conversation.create({
      participants: [
        { userId: parent._id, role: 'parent', joinedAt: new Date() },
        { userId: therapist._id, role: 'therapist', joinedAt: new Date() }
      ],
      type: 'direct'
    });
    
    // When: Send message with attachment
    const messageData = {
      conversationId: conversation._id,
      senderId: parent._id,
      content: 'Here is the latest progress report',
      messageType: 'text',
      attachments: [mockDocumentFile]
    };
    
    const message = await Message.create(messageData);
    
    // Then: Verify message and notification delivery
    expect(message).toBeDefined();
    expect(message.attachments).toHaveLength(1);
    
    // Verify WebSocket notification was sent
    expect(mockWebSocketManager.broadcastToConversation).toHaveBeenCalledWith(
      conversation._id.toString(),
      expect.objectContaining({
        type: 'message',
        payload: expect.objectContaining({
          content: 'Here is the latest progress report'
        })
      })
    );
  });
});
```

### 7.3 Performance Testing

```typescript
// tests/performance/load-testing.test.ts
describe('Performance Tests', () => {
  describe('Child Profile Loading', () => {
    it('should load child profile within 200ms', async () => {
      // Given
      const childId = testChild._id;
      
      // When
      const startTime = Date.now();
      const profile = await request(app)
        .get(`/api/children/${childId}/profile`)
        .set('Authorization', `Bearer ${authToken}`);
      const endTime = Date.now();
      
      // Then
      expect(endTime - startTime).toBeLessThan(200);
      expect(profile.status).toBe(200);
    });
  });
  
  describe('Search Performance', () => {
    it('should handle concurrent search requests efficiently', async () => {
      // Given
      const searchQuery = 'autism therapy';
      const concurrentRequests = 10;
      
      // When
      const promises = Array(concurrentRequests).fill(null).map(() =>
        request(app)
          .get('/api/search')
          .query({ q: searchQuery })
          .set('Authorization', `Bearer ${authToken}`)
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // Then
      expect(endTime - startTime).toBeLessThan(1000);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
```

### 7.4 Security Testing

```typescript
// tests/security/access-control.test.ts
describe('Security and Access Control', () => {
  describe('File Access Control', () => {
    it('should prevent unauthorized document access', async () => {
      // Given
      const parentA = await User.create(parentDataA);
      const parentB = await User.create(parentDataB);
      const document = await Document.create({
        ...documentData,
        uploadedBy: parentA._id,
        accessLevel: 'parent-only'
      });
      
      // When: Parent B tries to access Parent A's document
      const response = await request(app)
        .get(`/api/documents/${document._id}`)
        .set('Authorization', `Bearer ${parentBToken}`);
      
      // Then
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access denied');
    });
  });
  
  describe('Data Validation', () => {
    it('should prevent XSS attacks in message content', async () => {
      // Given
      const maliciousContent = '<script>alert("XSS")</script>';
      
      // When
      const response = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: maliciousContent,
          messageType: 'text'
        });
      
      // Then
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid content');
    });
  });
});
```

### 7.5 User Acceptance Testing Criteria

#### Enhanced Child Profile Features
- **Given** a parent user is logged in
- **When** they upload a photo to their child's profile
- **Then** the photo should appear in the media gallery within 5 seconds
- **And** a thumbnail should be generated automatically
- **And** the photo should be accessible to assigned therapists

#### Family Tree Visualization
- **Given** a user has family tree permissions
- **When** they add a new family member
- **Then** the family tree should update in real-time
- **And** the new member should appear in the correct generational position
- **And** relationship connections should be visually clear

#### Real-time Messaging
- **Given** two users are in an active conversation
- **When** one user sends a message
- **Then** the other user should receive it within 2 seconds
- **And** typing indicators should work correctly
- **And** message delivery status should be accurate

#### Document Management
- **Given** a user uploads a medical document
- **When** the document has an expiry date
- **Then** users should receive notifications 30, 7, and 1 days before expiry
- **And** expired documents should be clearly marked
- **And** document search should return relevant results

#### Video Calling
- **Given** users initiate a video call
- **When** all participants join
- **Then** audio and video quality should be acceptable
- **And** screen sharing should work properly
- **And** call recording should be optional and secure

---

## 8. Implementation Timeline

### Phase 2A (Weeks 1-4): Foundation
1. Database schema updates and migrations
2. File storage infrastructure setup
3. Basic media upload functionality
4. Enhanced child profile backend APIs

### Phase 2B (Weeks 5-8): Core Features
1. Family tree visualization system
2. Document management with cloud storage
3. Basic messaging infrastructure
4. Search functionality implementation

### Phase 2C (Weeks 9-12): Advanced Features
1. Real-time messaging and notifications
2. Video calling integration
3. Mobile responsiveness optimization
4. Performance optimization and testing

### Phase 2D (Weeks 13-16): Polish & Launch
1. Comprehensive testing and bug fixes
2. Security auditing and penetration testing
3. Documentation completion
4. Production deployment and monitoring

---

This comprehensive specification provides a detailed roadmap for implementing Phase 2 features while maintaining architectural consistency with your existing Next.js/MongoDB/JWT authentication system. Each component is designed to be modular, testable, and scalable for future enhancements.

### Authentication & Authorization Headers
All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### 1. Therapist Assignment Management

#### POST /api/therapist-assignments
This comprehensive specification provides a complete roadmap for implementing Phase 2 features that seamlessly integrate with your existing Next.js/MongoDB/JWT authentication system. Each component is designed to be modular, testable, and scalable for future enhancements.