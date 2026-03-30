"use client"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { type ProductSpecification } from '@/lib/services/bracelet-product.service';

interface SpecificationEditorProps {
  specifications: ProductSpecification[];
  onChange: (specs: ProductSpecification[]) => void;
}

const ICON_OPTIONS = [
  { value: 'battery', label: 'Battery' },
  { value: 'water', label: 'Water' },
  { value: 'monitor', label: 'Display' },
  { value: 'pulse', label: 'Heart Rate' },
  { value: 'bluetooth', label: 'Bluetooth' },
  { value: 'weight', label: 'Weight' },
  { value: 'brain', label: 'AI/Smart' },
  { value: 'alarm-light', label: 'Emergency' },
  { value: 'clock', label: 'Time' },
  { value: 'shield', label: 'Protection' },
  { value: 'thermometer', label: 'Temperature' },
  { value: 'activity', label: 'Activity' },
];

export function SpecificationEditor({ specifications, onChange }: SpecificationEditorProps) {
  const addSpecification = () => {
    const newSpec: ProductSpecification = {
      label_en: '',
      value_en: '',
      label: '',
      value: '',
      icon: 'battery'
    };
    onChange([...specifications, newSpec]);
  };

  const removeSpecification = (index: number) => {
    const updated = specifications.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateSpecification = (index: number, field: 'label' | 'value' | 'icon', value: string) => {
    const updated = specifications.map((spec, i) => {
      if (i !== index) return spec;

      // Update both legacy and bilingual fields for compatibility
      if (field === 'label') {
        return { ...spec, label: value, label_en: value };
      } else if (field === 'value') {
        return { ...spec, value: value, value_en: value };
      } else {
        return { ...spec, [field]: value };
      }
    });
    onChange(updated);
  };

  const moveSpecification = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === specifications.length - 1)
    ) {
      return;
    }

    const updated = [...specifications];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Product Specifications
          <Button onClick={addSpecification} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Specification
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {specifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No specifications added yet.</p>
            <p className="text-sm">Click &quot;Add Specification&quot; to get started.</p>
          </div>
        ) : (
          specifications.map((spec, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
              <div className="col-span-1 flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSpecification(index, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveSpecification(index, 'down')}
                  disabled={index === specifications.length - 1}
                >
                  ↓
                </Button>
              </div>

              <div className="col-span-3">
                <Label htmlFor={`label-${index}`}>Label</Label>
                <Input
                  id={`label-${index}`}
                  value={spec.label || spec.label_en || ''}
                  onChange={(e) => updateSpecification(index, 'label', e.target.value)}
                  placeholder="e.g., Battery Life"
                />
              </div>

              <div className="col-span-3">
                <Label htmlFor={`value-${index}`}>Value</Label>
                <Input
                  id={`value-${index}`}
                  value={spec.value || spec.value_en || ''}
                  onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                  placeholder="e.g., 7 days"
                />
              </div>

              <div className="col-span-4">
                <Label htmlFor={`icon-${index}`}>Icon</Label>
                <Select
                  value={spec.icon}
                  onValueChange={(value) => updateSpecification(index, 'icon', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSpecification(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}