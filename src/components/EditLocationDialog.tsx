import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BucketListItem } from '@/types/bucketList';

interface EditLocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: BucketListItem | null;
  onSave: (id: string, updates: Partial<BucketListItem>) => void;
}

const commonEmojis = ['📍', '🏖️', '🏔️', '🏛️', '🎡', '🗼', '🏰', '🌋', '🏝️', '🎪', '🎭', '🎨', '🎵', '🍕', '☕', '🛍️'];

export const EditLocationDialog: React.FC<EditLocationDialogProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    emoji: '📍',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description,
        emoji: item.emoji,
      });
    }
  }, [item]);

  const handleSave = () => {
    if (item) {
      onSave(item.id, formData);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{formData.emoji}</span>
            Edit Destination
          </DialogTitle>
          <DialogDescription>
            Update the details of your destination below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Emoji Selector */}
          <div className="space-y-2">
            <Label>Emoji</Label>
            <div className="grid grid-cols-8 gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setFormData({ ...formData, emoji })}
                  className={`p-2 text-lg rounded hover:bg-muted transition-colors ${
                    formData.emoji === emoji ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Input
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              placeholder="Or type custom emoji..."
              className="mt-2"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter destination name..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why do you want to visit this place?"
              rows={3}
            />
          </div>

          {/* Location Info */}
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            📍 Coordinates: {item.lat.toFixed(6)}, {item.lng.toFixed(6)}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-ocean">
            Save Changes
          </Button>
        </div>
        </DialogContent>
      </Dialog>
  );
};