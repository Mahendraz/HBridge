"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import {
  SearchIcon,
  FilterIcon,
  XIcon,
  CalendarIcon,
  UserIcon,
  FileIcon,
  MessageCircleIcon,
  BabyIcon,
  ClockIcon,
  HistoryIcon
} from "lucide-react";

interface GlobalSearchQuery {
  q: string;
  types?: ("children" | "users" | "documents" | "messages")[];
  childId?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string;
  page?: number;
  limit?: number;
}

interface QuickSearchResult {
  id: string;
  type: "child" | "user" | "document" | "message";
  title: string;
  subtitle?: string;
  avatar?: string;
  highlights?: string[];
  lastModified?: string;
}

interface GlobalSearchBarProps {
  onSearch: (query: GlobalSearchQuery) => void;
  onQuickSelect?: (result: QuickSearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  children?: Array<{ _id: string; name: string }>;
  recentSearches?: string[];
  isLoading?: boolean;
  quickResults?: QuickSearchResult[];
}

export function GlobalSearchBar({
  onSearch,
  onQuickSelect,
  placeholder = "Cari anak, dokumen, pesan...",
  showFilters = true,
  children = [],
  recentSearches = [],
  isLoading = false,
  quickResults = []
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showQuickResults, setShowQuickResults] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<GlobalSearchQuery["types"]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tags, setTags] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowQuickResults(false);
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;

    const searchQuery: GlobalSearchQuery = {
      q: query.trim(),
      types: selectedTypes && selectedTypes.length > 0 ? selectedTypes : undefined,
      childId: selectedChild || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      tags: tags || undefined,
      page: 1,
      limit: 20
    };

    onSearch(searchQuery);
    setShowQuickResults(false);
  }, [query, selectedTypes, selectedChild, dateFrom, dateTo, tags, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Show quick results when typing
    if (value.trim() && value.length > 2) {
      setShowQuickResults(true);
    } else {
      setShowQuickResults(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    } else if (e.key === "Escape") {
      setShowQuickResults(false);
      setIsExpanded(false);
    }
  };

  const handleQuickSelect = (result: QuickSearchResult) => {
    onQuickSelect?.(result);
    setQuery("");
    setShowQuickResults(false);
  };

  const toggleTypeFilter = (type: "users" | "children" | "messages" | "documents") => {
    setSelectedTypes(prev => 
      prev?.includes(type)
        ? prev.filter(t => t !== type)
        : [...(prev || []), type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedChild("");
    setDateFrom("");
    setDateTo("");
    setTags("");
  };

  const hasActiveFilters = (selectedTypes && selectedTypes.length > 0) || selectedChild || dateFrom || dateTo || tags;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "child":
      case "children":
        return <BabyIcon size={16} className="text-green-500" />;
      case "user":
      case "users":
        return <UserIcon size={16} className="text-teal-500" />;
      case "document":
      case "documents":
        return <FileIcon size={16} className="text-purple-500" />;
      case "message":
      case "messages":
        return <MessageCircleIcon size={16} className="text-orange-500" />;
      default:
        return <SearchIcon size={16} className="text-gray-500" />;
    }
  };

  const formatResultTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Main Search Input */}
      <div className="relative">
        <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() && query.length > 2) {
              setShowQuickResults(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-lg"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isLoading && <LoadingSpinner size="sm" />}
          
          {showFilters && (
            <Button
              variant={isExpanded ? "default" : "ghost"}
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <FilterIcon size={16} />
              {hasActiveFilters && (
                <span className="ml-1 bg-green-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {[(selectedTypes?.length || 0), selectedChild ? 1 : 0, dateFrom ? 1 : 0, dateTo ? 1 : 0, tags ? 1 : 0].reduce((a, b) => a + b, 0)}
                </span>
              )}
            </Button>
          )}
          
          <Button onClick={handleSearch} disabled={!query.trim() || isLoading}>
            <SearchIcon size={16} />
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTypes?.map(type => (
            <Badge key={type} variant="secondary" className="flex items-center gap-1">
              {getTypeIcon(type)}
              {type}
              <button onClick={() => toggleTypeFilter(type)}>
                <XIcon size={12} />
              </button>
            </Badge>
          ))}
          
          {selectedChild && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <UserIcon size={12} />
              Child: {children.find(c => c._id === selectedChild)?.name}
              <button onClick={() => setSelectedChild("")}>
                <XIcon size={12} />
              </button>
            </Badge>
          )}
          
          {(dateFrom || dateTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CalendarIcon size={12} />
              {dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 
               dateFrom ? `From ${dateFrom}` : `Until ${dateTo}`}
              <button onClick={() => { setDateFrom(""); setDateTo(""); }}>
                <XIcon size={12} />
              </button>
            </Badge>
          )}
          
          {tags && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Tags: {tags}
              <button onClick={() => setTags("")}>
                <XIcon size={12} />
              </button>
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Hapus Semua
          </Button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {isExpanded && showFilters && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-4 space-y-4">
            {/* Content Types */}
            <div>
              <label className="block text-sm font-medium mb-2">Cari di:</label>
              <div className="flex flex-wrap gap-2">
                {["children", "users", "documents", "messages"].map(type => (
                  <Badge
                    key={type}
                    variant={selectedTypes?.includes(type as any) ? "default" : "outline"}
                    className="cursor-pointer flex items-center gap-1"
                    onClick={() => toggleTypeFilter(type as any)}
                  >
                    {getTypeIcon(type)}
                    {{ children: "Anak", users: "Pengguna", documents: "Dokumen", messages: "Pesan" }[type] || type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Child Filter */}
            {children.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Anak tertentu:</label>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Semua anak</option>
                  {children.map(child => (
                    <option key={child._id} value={child._id}>{child.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dari tanggal:</label>
                <DatePicker
                  value={dateFrom}
                  onChange={(val) => setDateFrom(val)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hingga tanggal:</label>
                <DatePicker
                  value={dateTo}
                  onChange={(val) => setDateTo(val)}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tag (pisahkan koma):</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="terapi, progress, medis..."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hasil Cepat Dropdown */}
      {showQuickResults && (query.trim().length > 2 || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Hasil Cepat */}
            {quickResults.length > 0 && (
              <div>
                <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b bg-gray-50">
                  Hasil Cepat
                </div>
                {quickResults.map(result => (
                  <div
                    key={result.id}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleQuickSelect(result)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{result.title}</div>
                        {result.subtitle && (
                          <div className="text-xs text-gray-600 truncate">{result.subtitle}</div>
                        )}
                        {result.highlights && result.highlights.length > 0 && (
                          <div className="text-xs text-teal-600 truncate mt-1">
                            Cocok: {result.highlights.join(", ")}
                          </div>
                        )}
                      </div>
                      
                      {result.lastModified && (
                        <div className="flex-shrink-0 text-xs text-gray-500 flex items-center gap-1">
                          <ClockIcon size={12} />
                          {formatResultTime(result.lastModified)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pencarian Terakhir */}
            {query.trim().length === 0 && recentSearches.length > 0 && (
              <div>
                <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b bg-gray-50 flex items-center gap-2">
                  <HistoryIcon size={16} />
                  Pencarian Terakhir
                </div>
                {recentSearches.slice(0, 5).map((search, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      setQuery(search);
                      setShowQuickResults(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <HistoryIcon size={16} className="text-gray-500" />
                      <span className="text-sm">{search}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {query.trim().length > 2 && quickResults.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <SearchIcon size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm">Tidak ada hasil cepat</p>
                <p className="text-xs">Tekan Enter untuk mencari semua konten</p>
              </div>
            )}

            {/* Search Suggestion */}
            {query.trim().length > 0 && (
              <div className="px-4 py-2 border-t bg-gray-50">
                <button
                  onClick={handleSearch}
                  className="w-full text-left text-sm text-teal-600 hover:text-teal-700 flex items-center gap-2"
                  disabled={isLoading}
                >
                  <SearchIcon size={16} />
                  Cari semua konten untuk "{query.trim()}"
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}