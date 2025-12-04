"use client";

import React, { useState, useEffect } from 'react';
import axiosClient from '@/lib/axios-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconPicker } from './icon-picker';
import { CategoryDialogProps } from '@/lib/types';

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'
];

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  entityType,
  onSave
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState<string>('FiFolder');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setIcon(category.icon || 'FiFolder');
      setColor(category.color);
      setDescription(category.description || '');
      setOrder(category.order);
    } else {
      setName('');
      setSlug('');
      setIcon('FiFolder');
      setColor('#6366f1');
      setDescription('');
      setOrder(0);
    }
  }, [category, open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!category) {
      setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name,
        slug,
        icon,
        color,
        description: description || undefined,
        entity_type: entityType,
        order
      };

      if (category) {
        await axiosClient.patch(`/metadata/categories/${category.id}`, data);
      } else {
        await axiosClient.post('/metadata/categories', data);
      }

      onSave();
    } catch {

      alert('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Customer Service"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., customer-service"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === presetColor ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: presetColor }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value))}
              min={0}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
