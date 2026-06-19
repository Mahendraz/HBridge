"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  SearchIcon,
  FileIcon,
  MessageCircleIcon,
  UserIcon,
  BabyIcon,
  CalendarIcon,
  TagIcon,
  ExternalLinkIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  EyeIcon,
  DownloadIcon,
  ShareIcon,
  ChevronRightIcon,
  TrendingUpIcon
} from "lucide-react";

interface SearchResult {
  type: "child" | "user" | "document" | "message";
  entity: any;
  highlights: string[];
  relevanceScore: number;
  metadata?: {
    childName?: string;
    conversationTitle?: string;
    documentType?: string;
    lastModified?: string;
    [key: string]: any;
  };
}

interface SearchFacets {
  types: Record<string, number>;
  tags: Record<string, number>;
  users: Record<string, number>;
  dates?: Record<string, number>;
}

interface SearchResultsProps {
  results: SearchResult[];
  facets: SearchFacets;
  loading: boolean;
  query: string;
  totalResults?: number;
  currentPage?: number;
  totalPages?: number;
  onResultClick: (result: SearchResult) => void;
  onPageChange?: (page: number) => void;
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onFacetFilter?: (facetType: string, facetValue: string) => void;
  activeFacets?: Record<string, string[]>;
}

export function SearchResults({
  results,
  facets,
  loading,
  query,
  totalResults = 0,
  currentPage = 1,
  totalPages = 1,
  onResultClick,
  onPageChange,
  onSortChange,
  onFacetFilter,
  activeFacets = {}
}: SearchResultsProps) {
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedFacets, setExpandedFacets] = useState<Set<string>>(new Set(["types"]));

  const sortedResults = useMemo(() => {
    if (sortBy === "relevance") {
      return [...results].sort((a, b) => {
        return sortOrder === "desc" 
          ? b.relevanceScore - a.relevanceScore 
          : a.relevanceScore - b.relevanceScore;
      });
    }
    
    return [...results].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.metadata?.lastModified || a.entity.updatedAt || a.entity.createdAt || 0);
          bValue = new Date(b.metadata?.lastModified || b.entity.updatedAt || b.entity.createdAt || 0);
          break;
        case "title":
          aValue = (a.entity.title || a.entity.name || "").toLowerCase();
          bValue = (b.entity.title || b.entity.name || "").toLowerCase();
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [results, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      const newOrder = sortOrder === "asc" ? "desc" : "asc";
      setSortOrder(newOrder);
      onSortChange?.(field, newOrder);
    } else {
      setSortBy(field);
      setSortOrder("desc");
      onSortChange?.(field, "desc");
    }
  };

  const toggleFacet = (facetType: string) => {
    setExpandedFacets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(facetType)) {
        newSet.delete(facetType);
      } else {
        newSet.add(facetType);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: string, size = 16) => {
    const iconProps = { size, className: "flex-shrink-0" };
    switch (type) {
      case "child":
        return <BabyIcon {...iconProps} className="text-green-500" />;
      case "user":
        return <UserIcon {...iconProps} className="text-teal-500" />;
      case "document":
        return <FileIcon {...iconProps} className="text-purple-500" />;
      case "message":
        return <MessageCircleIcon {...iconProps} className="text-orange-500" />;
      default:
        return <SearchIcon {...iconProps} className="text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "child":
        return "bg-green-100 text-green-800";
      case "user":
        return "bg-teal-100 text-teal-800";
      case "document":
        return "bg-purple-100 text-purple-800";
      case "message":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Hari ini";
    if (diffInDays === 1) return "Kemarin";
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    return date.toLocaleDateString();
  };

  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights.length) return text;
    
    let highlightedText = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, "gi");
      highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const renderResultContent = (result: SearchResult) => {
    const { entity, type, highlights, metadata } = result;

    switch (type) {
      case "child":
        return (
          <div className="flex items-start space-x-3">
            <Avatar size="md">
              {entity.profile?.avatar ? (
                <AvatarImage src={entity.profile.avatar} alt={entity.name} />
              ) : (
                <AvatarFallback className="bg-green-100 text-green-600">
                  {entity.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg">
                {highlightText(entity.name, highlights)}
              </h4>
              {entity.diagnosis && (
                <p className="text-sm text-gray-600 mb-2">{entity.diagnosis}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Usia: {(() => {
                  const today = new Date();
                  const birth = new Date(entity.dateOfBirth);
                  return today.getFullYear() - birth.getFullYear();
                })()}</span>
                <span>•</span>
                <span>{formatDate(entity.updatedAt)}</span>
              </div>
            </div>
          </div>
        );

      case "user":
        return (
          <div className="flex items-start space-x-3">
            <Avatar size="md">
              {entity.avatar ? (
                <AvatarImage src={entity.avatar} alt={entity.name} />
              ) : (
                <AvatarFallback className="bg-green-100 text-teal-700">
                  {entity.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg">
                {highlightText(entity.name, highlights)}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {highlightText(entity.email, highlights)}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <Badge variant="outline" className="capitalize">
                  {entity.role}
                </Badge>
                <span>•</span>
                <span>{formatDate(entity.lastSeen || entity.updatedAt)}</span>
              </div>
            </div>
          </div>
        );

      case "document":
        return (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getTypeIcon("document", 24)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-lg mb-2">
                {highlightText(entity.title, highlights)}
              </h4>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${entity.type === "medical" ? "bg-red-100 text-red-800" :
                  entity.type === "educational" ? "bg-teal-100 text-teal-800" :
                  entity.type === "legal" ? "bg-purple-100 text-purple-800" :
                  "bg-gray-100 text-gray-800"}`}>
                  {entity.type}
                </Badge>
                
                {entity.tags?.length > 0 && (
                  <>
                    {entity.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {entity.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{entity.tags.length - 3}</span>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>By {metadata?.uploaderName || "Unknown"}</span>
                <span>•</span>
                <span>{formatDate(entity.uploadedAt)}</span>
                {entity.expiryDate && (
                  <>
                    <span>•</span>
                    <span className="text-yellow-600">
                      Expires {formatDate(entity.expiryDate)}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <EyeIcon size={16} />
              </Button>
              <Button variant="ghost" size="sm">
                <DownloadIcon size={16} />
              </Button>
            </div>
          </div>
        );

      case "message":
        return (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              {getTypeIcon("message", 24)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-semibold">
                  {metadata?.conversationTitle || "Direct Message"}
                </h4>
                {metadata?.childName && (
                  <Badge variant="outline" className="text-xs">
                    {metadata.childName}
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-700 mb-2 line-clamp-2">
                {highlightText(entity.content || "Attachment", highlights)}
              </p>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>By {entity.senderName || "Unknown"}</span>
                <span>•</span>
                <span>{formatDate(entity.sentAt)}</span>
                {entity.attachments?.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{entity.attachments.length} attachment{entity.attachments.length !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Facets Sidebar */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FilterIcon size={20} />
              Filter Hasil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Result Types */}
            <div>
              <button
                onClick={() => toggleFacet("types")}
                className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-teal-600"
              >
                Jenis Konten
                <ChevronRightIcon 
                  size={16} 
                  className={`transform transition-transform ${expandedFacets.has("types") ? "rotate-90" : ""}`}
                />
              </button>
              
              {expandedFacets.has("types") && (
                <div className="space-y-1 ml-4">
                  {Object.entries(facets.types).map(([type, count]) => (
                    <button
                      key={type}
                      onClick={() => onFacetFilter?.("type", type)}
                      className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-100 ${
                        activeFacets.type?.includes(type) ? "bg-teal-50 text-teal-700" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type, 14)}
                        <span className="capitalize">{type}</span>
                      </div>
                      <span className="text-gray-500">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            {Object.keys(facets.tags).length > 0 && (
              <div>
                <button
                  onClick={() => toggleFacet("tags")}
                  className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-teal-600"
                >
                  Tag
                  <ChevronRightIcon 
                    size={16} 
                    className={`transform transition-transform ${expandedFacets.has("tags") ? "rotate-90" : ""}`}
                  />
                </button>
                
                {expandedFacets.has("tags") && (
                  <div className="space-y-1 ml-4 max-h-32 overflow-y-auto">
                    {Object.entries(facets.tags)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([tag, count]) => (
                      <button
                        key={tag}
                        onClick={() => onFacetFilter?.("tags", tag)}
                        className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-100 ${
                          activeFacets.tags?.includes(tag) ? "bg-teal-50 text-teal-700" : ""
                        }`}
                      >
                        <span className="truncate">{tag}</span>
                        <span className="text-gray-500 ml-2">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Users */}
            {Object.keys(facets.users).length > 0 && (
              <div>
                <button
                  onClick={() => toggleFacet("users")}
                  className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-teal-600"
                >
                  Orang
                  <ChevronRightIcon 
                    size={16} 
                    className={`transform transition-transform ${expandedFacets.has("users") ? "rotate-90" : ""}`}
                  />
                </button>
                
                {expandedFacets.has("users") && (
                  <div className="space-y-1 ml-4 max-h-32 overflow-y-auto">
                    {Object.entries(facets.users)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([user, count]) => (
                      <button
                        key={user}
                        onClick={() => onFacetFilter?.("users", user)}
                        className={`flex items-center justify-between w-full text-sm py-1 px-2 rounded hover:bg-gray-100 ${
                          activeFacets.users?.includes(user) ? "bg-teal-50 text-teal-700" : ""
                        }`}
                      >
                        <span className="truncate">{user}</span>
                        <span className="text-gray-500 ml-2">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              Hasil Pencarian {query && (
                <span className="text-gray-600">untuk "{query}"</span>
              )}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {totalResults.toLocaleString()} hasil ditemukan
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Urutkan:</span>
            {["relevance", "date", "title", "type"].map(field => (
              <Button
                key={field}
                variant={sortBy === field ? "default" : "ghost"}
                size="sm"
                onClick={() => handleSort(field)}
                className="flex items-center gap-1"
              >
                {{ relevance: "Relevansi", date: "Tanggal", title: "Judul", type: "Jenis" }[field] || field}
                {sortBy === field && (
                  sortOrder === "asc" ? <SortAscIcon size={14} /> : <SortDescIcon size={14} />
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Results List */}
        {sortedResults.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <SearchIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Tidak ada hasil ditemukan
              </h3>
              <p className="text-gray-500">
                Coba sesuaikan kata kunci atau filter untuk menemukan yang dicari.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedResults.map((result, index) => (
              <Card
                key={`${result.type}-${result.entity._id || result.entity.id || index}`}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onResultClick(result)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={getTypeColor(result.type)}>
                        {getTypeIcon(result.type, 14)}
                        <span className="ml-1 capitalize">{result.type}</span>
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        <TrendingUpIcon size={14} className="text-green-500" />
                        <span className="text-xs text-gray-500">
                          {Math.round(result.relevanceScore * 100)}% cocok
                        </span>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <ExternalLinkIcon size={16} />
                    </Button>
                  </div>
                  
                  {renderResultContent(result)}
                  
                  {result.highlights.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Kata cocok:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.highlights.map((highlight, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-yellow-100">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              
              {totalPages > 5 && (
                <>
                  <span className="px-2">...</span>
                  <Button
                    variant={totalPages === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Berikutnya
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}