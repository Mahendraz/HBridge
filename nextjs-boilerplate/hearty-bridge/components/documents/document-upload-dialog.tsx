"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import {
  UploadIcon,
  FileIcon,
  XIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
  LockIcon
} from "lucide-react";

interface IDocument {
  type: "medical" | "educational" | "legal" | "other";
  accessLevel: "parent-only" | "therapist-only" | "shared";
}

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: Array<{ _id: string; name: string }>;
  onUpload: (document: {
    file: File;
    title: string;
    type: IDocument["type"];
    childId?: string;
    expiryDate?: string;
    tags: string[];
    isConfidential: boolean;
    accessLevel: IDocument["accessLevel"];
  }) => Promise<void>;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  children = [],
  onUpload
}: DocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<IDocument["type"]>("other");
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [accessLevel, setAccessLevel] = useState<IDocument["accessLevel"]>("shared");
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const resetForm = () => {
    setSelectedFile(null);
    setTitle("");
    setType("other");
    setSelectedChild("");
    setExpiryDate("");
    setTags([]);
    setCurrentTag("");
    setIsConfidential(false);
    setAccessLevel("shared");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        // Auto-generate title from filename
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExtension);
      }
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      addToast({
        title: "Informasi Tidak Lengkap",
        description: "Silakan pilih file dan berikan judul.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      await onUpload({
        file: selectedFile,
        title: title.trim(),
        type,
        childId: selectedChild || undefined,
        expiryDate: expiryDate || undefined,
        tags,
        isConfidential,
        accessLevel
      });

      resetForm();
      onOpenChange(false);
      addToast({
        title: "Dokumen Diunggah",
        description: "Dokumen Anda berhasil diunggah.",
        variant: "success"
      });
    } catch (error) {
      addToast({
        title: "Unggah Gagal",
        description: "Terjadi kesalahan saat mengunggah dokumen. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "📽️";
    return "📎";
  };

  const suggestedTags = {
    medical: ["diagnosis", "treatment", "therapy", "medication", "assessment", "progress", "specialist"],
    educational: ["IEP", "evaluation", "goals", "progress", "curriculum", "accommodation", "support"],
    legal: ["guardianship", "rights", "advocacy", "consent", "privacy", "compliance", "insurance"],
    other: ["family", "personal", "communication", "resources", "emergency", "contact", "notes"]
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon size={24} />
            Unggah Dokumen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Pilih File *</label>
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-1">Klik untuk memilih file atau seret dan lepas</p>
                <p className="text-sm text-gray-500">
                  Format didukung: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, dll.
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(selectedFile.type)}</span>
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                  >
                    <XIcon size={16} />
                  </Button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
            />
          </div>

          {/* Document Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Judul *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul dokumen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Jenis</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IDocument["type"])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="medical">Medis</option>
                <option value="educational">Pendidikan</option>
                <option value="legal">Legal</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Child Assignment and Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Anak Terkait</label>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Tidak ada anak tertentu</option>
                  {children.map(child => (
                    <option key={child._id} value={child._id}>{child.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <CalendarIcon size={16} />
                Tanggal Kedaluwarsa (opsional)
              </label>
              <DatePicker
                value={expiryDate}
                onChange={(val) => setExpiryDate(val)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <TagIcon size={16} />
              Tag
            </label>
            
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
                Add
              </Button>
            </div>

            {/* Suggested Tags */}
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-2">Tag yang disarankan untuk {type}:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedTags[type].map(suggestedTag => (
                  <Badge
                    key={suggestedTag}
                    variant={tags.includes(suggestedTag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      if (!tags.includes(suggestedTag)) {
                        setTags(prev => [...prev, suggestedTag]);
                      }
                    }}
                  >
                    {suggestedTag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Added Tags */}
            {tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Tag ditambahkan:</p>
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
              </div>
            )}
          </div>

          {/* Privacy and Access Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isConfidential"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isConfidential" className="text-sm font-medium flex items-center gap-2">
                <LockIcon size={16} />
                Tandai sebagai rahasia
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <EyeIcon size={16} />
                Tingkat Akses
              </label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as IDocument["accessLevel"])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="shared">Dibagikan (terlihat oleh tim terapi)</option>
                <option value="parent-only">Hanya orang tua</option>
                <option value="therapist-only">Hanya terapis</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {accessLevel === "shared" && "Dokumen akan terlihat oleh orang tua dan terapis yang ditugaskan"}
                {accessLevel === "parent-only" && "Dokumen hanya terlihat oleh orang tua"}
                {accessLevel === "therapist-only" && "Dokumen hanya terlihat oleh terapis"}
              </p>
            </div>
          </div>

          {/* Upload Progress / Status */}
          {selectedFile && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-teal-800">
                <FileIcon size={16} />
                <span>Siap diunggah: {selectedFile.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isUploading}
          >
            Batal
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || isUploading}
          >
            {isUploading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Mengunggah...
              </>
            ) : (
              <>
                <UploadIcon size={16} className="mr-2" />
                Unggah Dokumen
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Document View Dialog Component
export function DocumentViewDialog({
  open,
  onOpenChange,
  document
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
}) {
  if (!document) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="full">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Jenis:</strong> {document.type}</div>
            <div><strong>Ukuran:</strong> {formatFileSize(document.size)}</div>
            <div><strong>Diunggah:</strong> {new Date(document.uploadedAt).toLocaleString()}</div>
            <div><strong>Pengunggah:</strong> {document.uploaderName}</div>
            {document.expiryDate && (
              <div><strong>Kedaluwarsa:</strong> {new Date(document.expiryDate).toLocaleDateString()}</div>
            )}
            <div><strong>Akses:</strong> {document.accessLevel.replace("-", " ")}</div>
          </div>

          {document.tags.length > 0 && (
            <div>
              <strong>Tags:</strong>
              <div className="flex flex-wrap gap-2 mt-1">
                {document.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button onClick={() => window.open(document.fileUrl, "_blank")}>
              Buka Dokumen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Document Edit Dialog Component
export function DocumentEditDialog({
  open,
  onOpenChange,
  document,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
  onSave?: (documentId: string, updates: any) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [accessLevel, setAccessLevel] = useState<IDocument["accessLevel"]>("shared");
  const [isConfidential, setIsConfidential] = useState(false);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setTags(document.tags || []);
      setExpiryDate(document.expiryDate ? document.expiryDate.split('T')[0] : "");
      setAccessLevel(document.accessLevel);
      setIsConfidential(document.isConfidential);
    }
  }, [document]);

  const handleSave = async () => {
    if (!document || !onSave) return;

    await onSave(document._id, {
      title: title.trim(),
      tags,
      expiryDate: expiryDate || undefined,
      accessLevel,
      isConfidential
    });

    onOpenChange(false);
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit Dokumen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tanggal Kedaluwarsa</label>
            <DatePicker
              value={expiryDate}
              onChange={(val) => setExpiryDate(val)}
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
                    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
                      setTags(prev => [...prev, currentTag.trim()]);
                      setCurrentTag("");
                    }
                  }
                }}
                placeholder="Tambahkan tag..."
              />
              <Button
                onClick={() => {
                  if (currentTag.trim() && !tags.includes(currentTag.trim())) {
                    setTags(prev => [...prev, currentTag.trim()]);
                    setCurrentTag("");
                  }
                }}
                variant="outline"
              >
                Add
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                      <XIcon size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tingkat Akses</label>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as IDocument["accessLevel"])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="shared">Dibagikan</option>
              <option value="parent-only">Hanya Orang Tua</option>
              <option value="therapist-only">Hanya Terapis</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editConfidential"
              checked={isConfidential}
              onChange={(e) => setIsConfidential(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="editConfidential" className="text-sm">Tandai sebagai rahasia</label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave}>
            Simpan Perubahan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}