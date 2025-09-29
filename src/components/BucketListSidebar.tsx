import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Check, 
  X, 
  Download, 
  Upload, 
  Share2,
  Trophy,
  Target,
  Globe,
  ChevronLeft
} from 'lucide-react';
import { BucketListItem } from '@/types/bucketList';
import { EditLocationDialog } from './EditLocationDialog';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';

interface BucketListSidebarProps {
  bucketList: BucketListItem[];
  onUpdateItem: (id: string, updates: Partial<BucketListItem>) => void;
  onDeleteItem: (id: string) => void;
  onImport: (items: BucketListItem[]) => void;
  mapRef?: React.RefObject<HTMLDivElement>;
  onToggleSidebar: () => void;
}

export const BucketListSidebar: React.FC<BucketListSidebarProps> = ({
  bucketList,
  onUpdateItem,
  onDeleteItem,
  onImport,
  mapRef,
  onToggleSidebar,
}) => {
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const completedCount = bucketList.filter(item => item.completed).length;
  const totalCount = bucketList.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleEditItem = (item: BucketListItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = (id: string, updates: Partial<BucketListItem>) => {
    onUpdateItem(id, updates);
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(bucketList, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bucket-list.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Your bucket list has been downloaded as JSON.",
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          onImport(data);
          toast({
            title: "Import Successful",
            description: `Imported ${data.length} bucket list items.`,
          });
        }
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Please select a valid JSON file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const shareMap = async () => {
    const completedCount = bucketList.filter(item => item.completed).length;
    const shareText = `🌍 My Travel Bucket List ✈️\n\n${bucketList.length} amazing destinations planned!\n${completedCount} already completed! 🎉\n\nJoin me on this incredible journey!`;
    const url = window.location.href;

    try {
      // Try Web Share API first (works on mobile and some desktop browsers)
      if (navigator.share) {
        await navigator.share({
          title: '🌍 My Travel Bucket List ✈️',
          text: shareText,
          url: url,
        });
        toast({
          title: "Shared Successfully!",
          description: "Your bucket list has been shared.",
        });
        return;
      }

      // Desktop fallback: show social media options
      const platforms = [
        {
          name: 'Twitter/X',
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' ' + url)}`,
          icon: '🐦'
        },
        {
          name: 'Facebook',
          url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`,
          icon: '📘'
        },
        {
          name: 'WhatsApp',
          url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`,
          icon: '💬'
        },
        {
          name: 'LinkedIn',
          url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(shareText)}`,
          icon: '💼'
        }
      ];

      // Create a simple modal for platform selection
      const platformChoice = await new Promise<string | null>((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: system-ui, -apple-system, sans-serif;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 300px;
          width: 90%;
          text-align: center;
        `;

        content.innerHTML = `
          <h3 style="margin: 0 0 16px 0; color: #1a1a1a;">Share Your Bucket List</h3>
          <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Choose a platform to share:</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            ${platforms.map(platform => `
              <button data-platform="${platform.url}" style="
                padding: 12px 8px;
                border: 1px solid #ddd;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
              " onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='white'">
                <span style="font-size: 20px;">${platform.icon}</span>
                <span>${platform.name}</span>
              </button>
            `).join('')}
          </div>
          <button id="copy-link" style="
            margin-top: 12px;
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
          ">📋 Copy Link Instead</button>
          <button id="cancel" style="
            margin-top: 8px;
            padding: 8px 16px;
            background: transparent;
            color: #666;
            border: none;
            cursor: pointer;
            font-size: 12px;
          ">Cancel</button>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Handle clicks
        content.addEventListener('click', (e) => {
          const target = e.target as HTMLElement;
          const button = target.closest('button');
          
          if (!button) return;

          if (button.id === 'cancel') {
            resolve(null);
          } else if (button.id === 'copy-link') {
            resolve('copy');
          } else {
            const platform = button.getAttribute('data-platform');
            if (platform) resolve(platform);
          }
          
          document.body.removeChild(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            resolve(null);
            document.body.removeChild(modal);
          }
        });
      });

      if (!platformChoice) return;

      if (platformChoice === 'copy') {
        // Copy text and URL
        await navigator.clipboard.writeText(shareText + '\n\n' + url);
        toast({
          title: "Link Copied!",
          description: "Share text and link copied to clipboard.",
        });
      } else {
        // Open social media platform
        window.open(platformChoice, '_blank', 'width=600,height=400');
        toast({
          title: "Opening Social Media",
          description: "Share window opened in new tab.",
        });
      }

    } catch (error) {
      // Final fallback: just copy the text
      try {
        await navigator.clipboard.writeText(shareText + '\n\n' + url);
        toast({
          title: "Text Copied!",
          description: "Share text copied to clipboard. Paste it anywhere!",
        });
      } catch (clipboardError) {
        toast({
          title: "Share Failed",
          description: "Unable to share. Try copying the URL manually.",
          variant: "destructive",
        });
      }
    }
  };

  const downloadImage = (canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL();
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-bucket-list-map.png';
    link.click();
    toast({
      title: "Map Downloaded",
      description: "Your map screenshot has been saved!",
    });
  };

  const getBadges = () => {
    const badges = [];
    if (completedCount >= 1) badges.push({ name: "Explorer", icon: "🎯", color: "secondary" });
    if (completedCount >= 5) badges.push({ name: "Adventurer", icon: "🏃‍♂️", color: "primary" });
    if (completedCount >= 10) badges.push({ name: "Globetrotter", icon: "🌍", color: "adventure" });
    if (progressPercentage === 100 && totalCount > 0) badges.push({ name: "Dream Achiever", icon: "🏆", color: "accent" });
    return badges;
  };

  return (
    <div className="w-full h-full bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-sidebar-border bg-gradient-ocean relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="absolute top-2 right-2 text-primary-foreground hover:bg-white/20 bg-slate-700 hover:bg-slate-600 text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg md:text-xl font-bold text-primary-foreground pr-10">Bucket List</h1>
        <p className="text-xs md:text-sm text-primary-foreground/80">Click anywhere on the map to add a new destination!</p>
      </div>

      {/* Progress Section */}
      <div className="p-3 md:p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-sidebar-foreground">Progress</span>
          <span className="text-sm text-sidebar-foreground/60">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full bg-sidebar-accent rounded-full h-2">
          <div 
            className="bg-gradient-adventure h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-xs text-sidebar-foreground/60 mt-1">
          {progressPercentage.toFixed(0)}% Complete
        </p>

        {/* Badges */}
        {getBadges().length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium mb-2 text-sidebar-foreground">Achievements</p>
            <div className="flex flex-wrap gap-1">
              {getBadges().map((badge, index) => (
                <Badge key={index} variant="achievement" className="text-xs">
                  {badge.icon} {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 md:p-4 border-b border-sidebar-border">
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm" onClick={exportData} className="flex-1 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={shareMap} className="flex-1 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
        <div className="relative">
          <input
            type="file"
            accept=".json"
            onChange={importData}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Button variant="outline" size="sm" className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
            <Upload className="h-3 w-3 mr-1" />
            Import JSON
          </Button>
        </div>
      </div>

      {/* Bucket List Items */}
      <ScrollArea className="flex-1">
        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {bucketList.length === 0 ? (
            <div className="text-center py-8 text-sidebar-foreground/60">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No destinations yet!</p>
              <p className="text-xs">Click on the map to start your adventure.</p>
            </div>
          ) : (
            bucketList.map((item) => (
              <Card key={item.id} className={`${item.completed ? 'opacity-60' : ''} transition-opacity bg-sidebar-accent border-sidebar-border`}>
                <CardContent className="p-3">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{item.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-sidebar-foreground">
                            {item.title || 'Untitled Location'}
                          </h3>
                          {item.description && (
                            <p className="text-xs text-sidebar-foreground/60">{item.description}</p>
                          )}
                        </div>
                      </div>
                      {item.completed && (
                        <Badge variant="success" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditItem(item)}
                        disabled={item.completed}
                        className="flex-1 text-xs border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent disabled:opacity-50"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant={item.completed ? "secondary" : "default"}
                        size="sm" 
                        onClick={() => onUpdateItem(item.id, { completed: !item.completed })}
                        className="flex-1 text-xs"
                      >
                        {item.completed ? 'Undo' : 'Complete'}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => onDeleteItem(item.id)}
                        className="px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-sidebar-foreground/60 mt-2">
                      Added {new Date(item.dateAdded).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <EditLocationDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={handleEditSave}
      />
    </div>
  );
};