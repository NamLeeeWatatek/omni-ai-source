"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FiGrid, FiList, FiSearch, FiRefreshCw, FiPlus, FiFolderPlus, FiUpload, FiGlobe } from 'react-icons/fi';

interface KbToolbarProps {
  searchQuery: string;
  viewMode: 'grid' | 'table';
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onRefresh: () => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
  onUploadFile: () => void;
  onCrawlWebsite: () => void;
}

export function KbToolbar({
  searchQuery,
  viewMode,
  isLoading,
  onSearchChange,
  onViewModeChange,
  onRefresh,
  onCreateFolder,
  onCreateDocument,
  onUploadFile,
  onCrawlWebsite
}: KbToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
      {/* Search */}
      <div className="relative flex-1 w-full max-w-sm group">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input
          type="text"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-muted/30 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none h-auto"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="bg-muted/50 p-1 rounded-xl flex shadow-sm border border-border/40">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-background text-primary shadow-sm border border-border/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="Grid View"
          >
            <FiGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-background text-primary shadow-sm border border-border/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
            title="List View"
          >
            <FiList className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="rounded-xl border-border/60 hover:bg-muted/50"
          title="Refresh"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Quick Actions Dropdown */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFolder}
            className="rounded-lg h-9"
          >
            <FiFolderPlus className="w-4 h-4 mr-2" />
            Folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateDocument}
            className="rounded-lg h-9"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Doc
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onUploadFile}
            className="rounded-lg h-9"
          >
            <FiUpload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCrawlWebsite}
            className="rounded-lg h-9"
          >
            <FiGlobe className="w-4 h-4 mr-2" />
            Crawl
          </Button>
        </div>
      </div>
    </div>
  );
}
