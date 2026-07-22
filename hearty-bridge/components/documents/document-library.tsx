"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  FileIcon,
  UploadIcon,
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  ShareIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  AlertTriangleIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  SortAscIcon,
  SortDescIcon,
  XIcon,
  FileTextIcon,
  ImageIcon,
  FilesIcon
} from "lucide-react";

interface IDocument {
  _id: string;
  title: string;
  type: "medical" | "educational" | "legal" | "other";
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
  expiryDate?: string;
  tags: string[];
  isConfidential: boolean;
  accessLevel: "parent-only" | "therapist-only" | "shared";
  size: number;
  mimeType: string;
  uploaderName: string;
  isExpiring: boolean;
  daysUntilExpiry?: number;
}

interface DocumentLibraryProps {
  documents: IDocument[];
  children?: Array<{ _id: string; name: string }>;
  canUpload: boolean;
  canEdit: boolean;
  canDelete: boolean;
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
  onEdit?: (documentId: string, updates: Partial<IDocument>) => Promise<void>;
  onDelete?: (documentId: string) => Promise<void>;
  onShare?: (documentId: string, shareOptions: { userIds: string[]; message?: string }) => Promise<void>;
}

type SortField = "title" | "uploadedAt" | "expiryDate" | "type" | "size";
type SortOrder = "asc" | "desc";

export function DocumentLibrary({
  documents,
  children = [],
  canUpload,
  canEdit,
  canDelete,
  onUpload,
  onEdit,
  onDelete,
  onShare
}: DocumentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | IDocument["type"]>("all");
  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [showConfidentialOnly, setShowConfidentialOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("uploadedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<IDocument | null>(null);
  const [editingDocument, setEditingDocument] = useState<IDocument | null>(null);
  
  const { addToast } = useToast();

  const allTags = useMemo(() => {
    return Array.from(new Set(documents.flatMap(doc => doc.tags)));
  }, [documents]);

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(document => {
      const searchMatch = !searchTerm || 
        document.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        document.uploaderName.toLowerCase().includes(searchTerm.toLowerCase());

      const typeMatch = selectedType === "all" || document.type === selectedType;
      
      const tagMatch = selectedTags.length === 0 || 
        selectedTags.every(tag => document.tags.includes(tag));
      
      const expiringMatch = !showExpiringOnly || document.isExpiring;
      
      const confidentialMatch = !showConfidentialOnly || document.isConfidential;

      return searchMatch && typeMatch && tagMatch && expiringMatch && confidentialMatch;
    });

    // Sort documents
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "uploadedAt":
          aValue = new Date(a.uploadedAt);
          bValue = new Date(b.uploadedAt);
          break;
        case "expiryDate":
          aValue = a.expiryDate ? new Date(a.expiryDate) : new Date(0);
          bValue = b.expiryDate ? new Date(b.expiryDate) : new Date(0);
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [documents, searchTerm, selectedType, selectedTags, showExpiringOnly, showConfidentialOnly, sortField, sortOrder]);

  const documentStats = useMemo(() => {
    return {
      total: documents.length,
      medical: documents.filter(d => d.type === "medical").length,
      educational: documents.filter(d => d.type === "educational").length,
      legal: documents.filter(d => d.type === "legal").length,
      other: documents.filter(d => d.type === "other").length,
      expiring: documents.filter(d => d.isExpiring).length,
      confidential: documents.filter(d => d.isConfidential).length
    };
  }, [documents]);

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

  const getTypeIcon = (type: IDocument["type"]) => {
    switch (type) {
      case "medical":
        return <FileTextIcon size={16} className="text-red-500" />;
      case "educational":
        return <FileIcon size={16} className="text-teal-500" />;
      case "legal":
        return <FilesIcon size={16} className="text-purple-500" />;
      case "other":
        return <FileIcon size={16} className="text-gray-500" />;
      default:
        return <FileIcon size={16} />;
    }
  };

  const getTypeColor = (type: IDocument["type"]) => {
    switch (type) {
      case "medical":
        return "bg-red-100 text-red-800";
      case "educational":
        return "bg-teal-100 text-teal-800";
      case "legal":
        return "bg-purple-100 text-purple-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAccessLevelColor = (accessLevel: IDocument["accessLevel"]) => {
    switch (accessLevel) {
      case "parent-only":
        return "bg-green-100 text-green-800";
      case "therapist-only":
        return "bg-yellow-100 text-yellow-800";
      case "shared":
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setSelectedChild("all");
    setSelectedTags([]);
    setShowExpiringOnly(false);
    setShowConfidentialOnly(false);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileIcon size={24} className="mx-auto text-teal-600 mb-2" />
            <div className="text-2xl font-bold">{documentStats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileTextIcon size={24} className="mx-auto text-red-600 mb-2" />
            <div className="text-2xl font-bold text-red-600">{documentStats.medical}</div>
            <div className="text-xs text-gray-600">Medis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileIcon size={24} className="mx-auto text-teal-600 mb-2" />
            <div className="text-2xl font-bold text-teal-600">{documentStats.educational}</div>
            <div className="text-xs text-gray-600">Pendidikan</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FilesIcon size={24} className="mx-auto text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-purple-600">{documentStats.legal}</div>
            <div className="text-xs text-gray-600">Legal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangleIcon size={24} className="mx-auto text-yellow-600 mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{documentStats.expiring}</div>
            <div className="text-xs text-gray-600">Kedaluwarsa</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <EyeIcon size={24} className="mx-auto text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-600">{documentStats.confidential}</div>
            <div className="text-xs text-gray-600">Rahasia</div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FilesIcon size={24} />
                Perpustakaan Dokumen
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAndSortedDocuments.length} dari {documents.length} dokumen
              </p>
            </div>
            
            {canUpload && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <UploadIcon size={16} className="mr-2" />
                Unggah Dokumen
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Cari dokumen berdasarkan judul, tag, atau pengunggah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">Semua Jenis</option>
              <option value="medical">Medis</option>
              <option value="educational">Pendidikan</option>
              <option value="legal">Legal</option>
              <option value="other">Lainnya</option>
            </select>

            {children.length > 0 && (
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Semua Anak</option>
                {children.map(child => (
                  <option key={child._id} value={child._id}>{child.name}</option>
                ))}
              </select>
            )}

            <Button
              variant={showExpiringOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowExpiringOnly(!showExpiringOnly)}
            >
              <AlertTriangleIcon size={16} className="mr-2" />
              Segera Kedaluwarsa
            </Button>

            <Button
              variant={showConfidentialOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowConfidentialOnly(!showConfidentialOnly)}
            >
              <EyeIcon size={16} className="mr-2" />
              Rahasia
            </Button>

            {(searchTerm || selectedType !== "all" || selectedTags.length > 0 || showExpiringOnly || showConfidentialOnly) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Hapus Filter
              </Button>
            )}
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Filter berdasarkan Tag:</label>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {allTags.length > 10 && (
                  <span className="text-sm text-gray-500">+{allTags.length - 10} lainnya</span>
                )}
              </div>
            </div>
          )}

          {/* Active filters */}
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter tag aktif:</span>
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <XIcon size={12} />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sort Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Urutkan:</span>
            {(["title", "uploadedAt", "expiryDate", "type", "size"] as const).map(field => (
              <Button
                key={field}
                variant={sortField === field ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSort(field)}
                className="flex items-center gap-1"
              >
                {field === "uploadedAt" ? "Tanggal" : field.charAt(0).toUpperCase() + field.slice(1)}
                {sortField === field && (
                  sortOrder === "asc" ? <SortAscIcon size={14} /> : <SortDescIcon size={14} />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {filteredAndSortedDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              {documents.length === 0 ? "Belum ada dokumen" : "Dokumen tidak ditemukan"}
            </h4>
            <p className="text-gray-500 mb-4">
              {documents.length === 0 
                ? "Unggah dokumen pertama Anda untuk memulai."
                : "Coba sesuaikan pencarian atau filter untuk menemukan yang dicari."}
            </p>
            {documents.length === 0 && canUpload && (
              <Button onClick={() => setUploadDialogOpen(true)} variant="outline">
                <UploadIcon size={16} className="mr-2" />
                Unggah Dokumen Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedDocuments.map((document) => (
            <Card key={document._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(document.type)}
                    <Badge className={getTypeColor(document.type)}>
                      {document.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {document.isConfidential && (
                      <EyeIcon size={16} className="text-yellow-500" />
                    )}
                    {document.isExpiring && (
                      <AlertTriangleIcon 
                        size={16} 
                        className="text-red-500" 
                      />
                    )}
                  </div>
                </div>

                <h4 className="font-semibold text-sm mb-2 line-clamp-2">{document.title}</h4>

                <div className="space-y-2 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <UserIcon size={12} />
                    <span>{document.uploaderName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={12} />
                    <span>Diunggah {formatDate(document.uploadedAt)}</span>
                  </div>
                  
                  {document.expiryDate && (
                    <div className="flex items-center gap-2">
                      <AlertTriangleIcon size={12} />
                      <span>
                        Kedaluwarsa {formatDate(document.expiryDate)}
                        {document.daysUntilExpiry !== undefined && (
                          <span className={document.daysUntilExpiry <= 7 ? "text-red-600 ml-1" : "ml-1"}>
                            ({document.daysUntilExpiry} hari)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span>{formatFileSize(document.size)}</span>
                    <Badge className={getAccessLevelColor(document.accessLevel)} size="sm">
                      {document.accessLevel.replace("-", " ")}
                    </Badge>
                  </div>
                </div>

                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {document.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs py-0 px-1">
                        {tag}
                      </Badge>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{document.tags.length - 3} lainnya</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingDocument(document)}
                    >
                      <EyeIcon size={14} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(document.fileUrl, "_blank")}
                    >
                      <DownloadIcon size={14} />
                    </Button>
                    
                    {onShare && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Open share dialog
                        }}
                      >
                        <ShareIcon size={14} />
                      </Button>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingDocument(document)}
                      >
                        <EditIcon size={14} />
                      </Button>
                      
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(document._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon size={14} />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog - TODO: Implement DocumentUploadDialog component */}

      {/* View Dialog - TODO: Implement DocumentViewDialog component */}

      {/* Edit Dialog - TODO: Implement DocumentEditDialog component */}
    </div>
  );
}

// Additional components for dialogs will be created in separate files for better organization