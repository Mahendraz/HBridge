"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import {
  UploadIcon,
  ImageIcon,
  VideoIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  ShareIcon,
  TagIcon,
  CalendarIcon,
  XIcon,
  PlayIcon
} from "lucide-react";

interface IMediaFile {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnail?: string;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
  description?: string;
  isPublic: boolean;
}

interface MediaGalleryProps {
  childId: string;
  type: "photos" | "videos" | "all";
  canUpload: boolean;
  onUpload: (files: File[], metadata: { tags: string[]; description?: string; isPublic: boolean }) => Promise<void>;
  initialMedia?: IMediaFile[];
}

export function MediaGallery({
  childId,
  type,
  canUpload,
  onUpload,
  initialMedia = []
}: MediaGalleryProps) {
  const [media, setMedia] = useState<IMediaFile[]>(initialMedia);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<IMediaFile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = type === "all" || 
                       (type === "photos" && item.mimeType.startsWith("image/")) ||
                       (type === "videos" && item.mimeType.startsWith("video/"));
    
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.every(tag => item.tags.includes(tag));
    
    return matchesSearch && matchesType && matchesTags;
  });

  const allTags = Array.from(new Set(media.flatMap(item => item.tags)));

  const handleFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      return type === "all" ? (isImage || isVideo) : 
             type === "photos" ? isImage : isVideo;
    });

    if (validFiles.length !== files.length) {
      addToast({
        title: "File Tidak Valid",
        description: `Beberapa file dilewati karena tidak sesuai jenis yang dipilih.`,
        variant: "destructive"
      });
    }

    if (validFiles.length === 0) return;

    setUploadDialogOpen(true);
    // Store files for later upload
    (window as any).pendingFiles = validFiles;
  }, [type, addToast]);

  const handleUpload = useCallback(async (uploadData: {
    tags: string[];
    description?: string;
    isPublic: boolean;
  }) => {
    const files = (window as any).pendingFiles as File[];
    if (!files) return;

    setIsLoading(true);
    try {
      await onUpload(files, uploadData);
      setUploadDialogOpen(false);
      addToast({
        title: "Unggah Berhasil",
        description: `${files.length} file berhasil diunggah.`,
        variant: "success"
      });
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      delete (window as any).pendingFiles;
    } catch (error) {
      addToast({
        title: "Unggah Gagal",
        description: "Terjadi kesalahan saat mengunggah file. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [onUpload, addToast]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">
            {type === "photos" ? "Foto" : type === "videos" ? "Video" : "Galeri Media"}
          </h3>
          <p className="text-sm text-gray-600">
            {filteredMedia.length} {filteredMedia.length === 1 ? "item" : "item"}
          </p>
        </div>
        
        {canUpload && (
          <Button onClick={handleFileSelect} disabled={isLoading}>
            <UploadIcon size={16} className="mr-2" />
            Unggah {type === "photos" ? "Foto" : type === "videos" ? "Video" : "Media"}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Cari berdasarkan nama file, deskripsi, atau tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 5).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <XIcon size={12} />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="text-xs"
              >
                Hapus semua
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            {type === "photos" ? <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" /> :
             type === "videos" ? <VideoIcon size={48} className="mx-auto text-gray-400 mb-4" /> :
             <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />}
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              Tidak ada {type === "photos" ? "foto" : type === "videos" ? "video" : "media"} ditemukan
            </h4>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedTags.length > 0 
                ? "Coba sesuaikan pencarian atau filter." 
                : `Mulai dengan mengunggah beberapa ${type === "photos" ? "foto" : type === "videos" ? "video" : "file"}.`}
            </p>
            {canUpload && !searchTerm && selectedTags.length === 0 && (
              <Button onClick={handleFileSelect} variant="outline">
                <UploadIcon size={16} className="mr-2" />
                Unggah Sekarang
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <Card key={item._id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div 
                className="relative aspect-square bg-gray-100"
                onClick={() => {
                  setSelectedMedia(item);
                  setViewDialogOpen(true);
                }}
              >
                {item.mimeType.startsWith("image/") ? (
                  <img
                    src={item.thumbnail || item.url}
                    alt={item.originalName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center">
                      <PlayIcon size={32} className="mx-auto text-gray-400 mb-2" />
                      <VideoIcon size={16} className="mx-auto text-gray-600" />
                    </div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-3">
                <h4 className="font-medium text-sm truncate mb-1">{item.originalName}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{formatFileSize(item.size)}</span>
                  <span>{formatDate(item.uploadedAt)}</span>
                </div>
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs py-0 px-1">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept={type === "photos" ? "image/*" : type === "videos" ? "video/*" : "image/*,video/*"}
        onChange={handleFileChange}
      />

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
        isLoading={isLoading}
      />

      {/* Media Viewer Dialog */}
      <MediaViewerDialog
        media={selectedMedia}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  );
}

// Upload Dialog Component
function UploadDialog({ 
  open, 
  onOpenChange, 
  onUpload, 
  isLoading 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onUpload: (data: { tags: string[]; description?: string; isPublic: boolean }) => Promise<void>;
  isLoading: boolean;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    await onUpload({ tags, description, isPublic });
    // Reset form
    setTags([]);
    setCurrentTag("");
    setDescription("");
    setIsPublic(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Unggah File Media</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Deskripsi (opsional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan deskripsi untuk file ini..."
              className="w-full p-2 border border-gray-300 rounded-md resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tag</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Tambahkan tag..."
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                <TagIcon size={16} />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>
                      <XIcon size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isPublic" className="text-sm">
              Jadikan file terlihat oleh tim terapi
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" /> : "Unggah File"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Media Viewer Dialog Component
function MediaViewerDialog({ 
  media, 
  open, 
  onOpenChange 
}: { 
  media: IMediaFile | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="full">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle>{media.originalName}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <DownloadIcon size={16} className="mr-2" />
                Unduh
              </Button>
              <Button variant="outline" size="sm">
                <ShareIcon size={16} className="mr-2" />
                Bagikan
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center bg-gray-50 rounded-lg p-4">
            {media.mimeType.startsWith("image/") ? (
              <img
                src={media.url}
                alt={media.originalName}
                className="max-w-full max-h-[60vh] object-contain"
              />
            ) : (
              <video
                src={media.url}
                controls
                className="max-w-full max-h-[60vh]"
              >
                Browser Anda tidak mendukung tag video.
              </video>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Ukuran file:</strong> {(() => {
                if (media.size === 0) return "0 Bytes";
                const k = 1024;
                const sizes = ["Bytes", "KB", "MB", "GB"];
                const i = Math.floor(Math.log(media.size) / Math.log(k));
                return parseFloat((media.size / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
              })()}
            </div>
            <div>
              <strong>Diunggah:</strong> {new Date(media.uploadedAt).toLocaleString()}
            </div>
            <div>
              <strong>Jenis:</strong> {media.mimeType}
            </div>
            <div>
              <strong>Visibilitas:</strong> {media.isPublic ? "Publik" : "Pribadi"}
            </div>
          </div>
          
          {media.description && (
            <div>
              <strong>Deskripsi:</strong>
              <p className="mt-1 text-gray-600">{media.description}</p>
            </div>
          )}
          
          {media.tags.length > 0 && (
            <div>
              <strong>Tag:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {media.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}