"use client";

import React, { useEffect, useState } from 'react';
import axiosClient from '@/lib/axios-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Icons from 'react-icons/fi';
import { FiFolder } from 'react-icons/fi';
import { Category, CategorySelectorProps } from '@/lib/types';

export function CategorySelector({
  entityType,
  value,
  onChange,
  placeholder = "Select category"
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await axiosClient.get(`/metadata/categories?entity_type=${entityType}`);
        const data = response.data || response;
        setCategories(data);
      } catch {

      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [entityType]);

  const selectedCategory = categories.find(c => c.id === value);

  if (loading) {
    return <div className="h-10 bg-muted animate-pulse rounded-md" />;
  }

  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(val ? parseInt(val) : undefined)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {selectedCategory && (
            <div className="flex items-center gap-2">
              {(() => {
                const IconComponent = selectedCategory.icon
                  ? (Icons as any)[selectedCategory.icon]
                  : FiFolder;
                return (
                  <IconComponent
                    className="size-4"
                    style={{ color: selectedCategory.color }}
                  />
                );
              })()}
              <span>{selectedCategory.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => {
          const IconComponent = category.icon
            ? (Icons as any)[category.icon]
            : FiFolder;

          return (
            <SelectItem key={category.id} value={category.id.toString()}>
              <div className="flex items-center gap-2">
                <IconComponent
                  className="size-4"
                  style={{ color: category.color }}
                />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
