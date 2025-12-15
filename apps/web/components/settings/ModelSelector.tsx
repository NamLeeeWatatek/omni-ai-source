"use client";

import React, { useEffect, useState } from 'react';
import { axiosClient } from '@/lib/axios-client';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

interface ModelOption {
  provider: string;
  model_name: string;
  display_name: string;
  description?: string;
  api_key_configured: boolean;
  is_available: boolean;
  capabilities: string[];
  max_tokens: number;
  is_default?: boolean;
  is_recommended?: boolean;
}

interface ModelSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  filterProvider?: string;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  filterProvider,
  className
}: ModelSelectorProps) {
  const { t } = useTranslation()
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await axiosClient.get('/ai-providers/models');
      const allModels = response.flatMap((p: any) => p.models);
      setModels(allModels);
    } catch {
      console.error('Failed to load models:');
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = filterProvider
    ? models.filter(m => m.provider === filterProvider)
    : models;

  if (loading) {
    return <Spinner className="size-4" />;
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={t('ai.selectModel', 'Select a model')} />
      </SelectTrigger>
      <SelectContent>
        {filteredModels.map((model) => (
          <SelectItem
            key={model.model_name}
            value={model.model_name}
            disabled={!model.is_available}
          >
            <div className="flex items-center gap-2">
              <span>{model.display_name}</span>
              {model.is_recommended && (
                <Badge variant="outline" className="text-[8px] px-1 py-0">
                  {t('common.recommended', 'Recommended')}
                </Badge>
              )}
              {!model.is_available && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0">
                  {t('common.notAvailable', 'Not Available')}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
