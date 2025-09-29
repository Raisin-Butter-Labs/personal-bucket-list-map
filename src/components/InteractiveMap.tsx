import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { EditLocationDialog } from './EditLocationDialog';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { BucketListItem } from '@/types/bucketList';

interface InteractiveMapProps {
  bucketList: BucketListItem[];
  onAddItem: (item: Omit<BucketListItem, 'id' | 'dateAdded'>) => void;
  onUpdateItem: (id: string, updates: Partial<BucketListItem>) => void;
  onDeleteItem: (id: string) => void;
  sidebarOpen: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  bucketList,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  sidebarOpen,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [isDark, setIsDark] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketListItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with default world view first
    const map = L.map(mapRef.current).setView([20, 0], 2);
    mapInstanceRef.current = map;

    // Try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Zoom to user's location
          map.setView([latitude, longitude], 10);
          
          // Add a marker for current location
          const currentLocationMarker = L.marker([latitude, longitude])
            .bindPopup(`
              <div class="p-2">
                <strong>📍 Lokasi Anda</strong><br>
                <small>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}</small>
              </div>
            `)
            .addTo(map);
          
          // Style current location marker differently
          currentLocationMarker.getElement()?.style.setProperty('filter', 'hue-rotate(120deg)');
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          // Keep default world view if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    // Add initial tile layer
    updateTileLayer(map, isDark);

    // Add click handler for adding new items
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onAddItem({
        lat,
        lng,
        title: '',
        description: '',
        emoji: '📍',
        completed: false,
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onAddItem]);

  // Handle sidebar toggle - invalidate map size and refresh markers
  useEffect(() => {
    if (mapInstanceRef.current) {
      // Delay to allow transition to complete
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
        // Force markers to re-render by clearing and re-adding them
        const currentItems = [...bucketList];
        markersRef.current.forEach((marker) => {
          mapInstanceRef.current?.removeLayer(marker);
        });
        markersRef.current.clear();
        
        // Re-add all markers
        currentItems.forEach((item) => {
          const marker = L.marker([item.lat, item.lng]);
          
          const popupContent = `
            <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 24px; line-height: 1;">${item.emoji}</span>
                <strong style="font-size: 15px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">${item.title || 'New Location'}</strong>
              </div>
              ${item.description ? `<p style="font-size: 13px; color: #6b7280; margin-bottom: 12px; line-height: 1.4;">${item.description}</p>` : ''}
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button 
                  onclick="window.dispatchEvent(new CustomEvent('editBucketItem', { detail: '${item.id}' }))"
                  style="padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: ${item.completed ? '#9ca3af' : '#3b82f6'}; color: white; border: none; border-radius: 6px; cursor: ${item.completed ? 'not-allowed' : 'pointer'}; transition: all 0.2s;"
                  ${item.completed ? 'disabled' : ''}
                  onmouseover="if(!this.disabled) this.style.backgroundColor='#2563eb'"
                  onmouseout="if(!this.disabled) this.style.backgroundColor='#3b82f6'"
                >
                  ✏️ Edit
                </button>
                <button 
                  onclick="window.dispatchEvent(new CustomEvent('toggleBucketItem', { detail: '${item.id}' }))"
                  style="padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: ${item.completed ? '#f59e0b' : '#10b981'}; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s;"
                  onmouseover="this.style.backgroundColor='${item.completed ? '#d97706' : '#059669'}'"
                  onmouseout="this.style.backgroundColor='${item.completed ? '#f59e0b' : '#10b981'}'"
                >
                  ${item.completed ? '↩️ Undo' : '✓ Complete'}
                </button>
                <button 
                  onclick="window.dispatchEvent(new CustomEvent('deleteBucketItem', { detail: '${item.id}' }))"
                  style="padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s;"
                  onmouseover="this.style.backgroundColor='#dc2626'"
                  onmouseout="this.style.backgroundColor='#ef4444'"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, { maxWidth: 250 });
          marker.addTo(mapInstanceRef.current!);
          markersRef.current.set(item.id, marker);

          // Style marker based on completion status - green for completed
          if (item.completed) {
            const greenIcon = new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            });
            marker.setIcon(greenIcon);
          }
        });
      }, 300);
    }
  }, [sidebarOpen, bucketList]);

  // Update tile layer when theme changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateTileLayer(mapInstanceRef.current, isDark);
    }
  }, [isDark]);

  // Update markers when bucket list changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove old markers
    markersRef.current.forEach((marker) => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    // Add new markers
    bucketList.forEach((item) => {
      const marker = L.marker([item.lat, item.lng]);
      
      // Custom popup content with better styling
      const popupContent = `
        <div style="padding: 12px; min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 24px; line-height: 1;">${item.emoji}</span>
            <strong style="font-size: 15px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">${item.title || 'New Location'}</strong>
          </div>
          ${item.description ? `<p style="font-size: 13px; color: #6b7280; margin-bottom: 12px; line-height: 1.4;">${item.description}</p>` : ''}
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button 
              onclick="window.dispatchEvent(new CustomEvent('editBucketItem', { detail: '${item.id}' }))"
              style="padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: ${item.completed ? '#9ca3af' : '#3b82f6'}; color: white; border: none; border-radius: 6px; cursor: ${item.completed ? 'not-allowed' : 'pointer'}; transition: all 0.2s;"
              ${item.completed ? 'disabled' : ''}
              onmouseover="if(!this.disabled) this.style.backgroundColor='#2563eb'"
              onmouseout="if(!this.disabled) this.style.backgroundColor='#3b82f6'"
            >
              ✏️ Edit
            </button>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('toggleBucketItem', { detail: '${item.id}' }))"
              style="padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: ${item.completed ? '#f59e0b' : '#10b981'}; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.backgroundColor='${item.completed ? '#d97706' : '#059669'}'"
              onmouseout="this.style.backgroundColor='${item.completed ? '#f59e0b' : '#10b981'}'"
            >
              ${item.completed ? '↩️ Undo' : '✓ Complete'}
            </button>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('deleteBucketItem', { detail: '${item.id}' }))"
              style="padding: 6px 12px; font-size: 12px; font-weight: 500; background-color: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s;"
              onmouseover="this.style.backgroundColor='#dc2626'"
              onmouseout="this.style.backgroundColor='#ef4444'"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 250 });
      marker.addTo(map);
      markersRef.current.set(item.id, marker);

        // Style marker based on completion status - green for completed
        if (item.completed) {
          // Create proper green marker icon
          const greenIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          marker.setIcon(greenIcon);
        }
    });
  }, [bucketList]);

  // Event listeners for marker actions
  useEffect(() => {
  const handleEdit = (e: CustomEvent) => {
      const itemId = e.detail;
      const item = bucketList.find(item => item.id === itemId);
      if (item && !item.completed) {
        setEditingItem(item);
        setIsEditDialogOpen(true);
      }
    };

    const handleToggle = (e: CustomEvent) => {
      const itemId = e.detail;
      const item = bucketList.find(item => item.id === itemId);
      if (item) {
        onUpdateItem(itemId, { completed: !item.completed });
      }
    };

    const handleDelete = (e: CustomEvent) => {
      const itemId = e.detail;
      if (confirm('Are you sure you want to delete this item?')) {
        onDeleteItem(itemId);
      }
    };

    window.addEventListener('editBucketItem', handleEdit as EventListener);
    window.addEventListener('toggleBucketItem', handleToggle as EventListener);
    window.addEventListener('deleteBucketItem', handleDelete as EventListener);

    return () => {
      window.removeEventListener('editBucketItem', handleEdit as EventListener);
      window.removeEventListener('toggleBucketItem', handleToggle as EventListener);
      window.removeEventListener('deleteBucketItem', handleDelete as EventListener);
    };
  }, [bucketList, onUpdateItem, onDeleteItem]);

  const handleEditSave = (id: string, updates: Partial<BucketListItem>) => {
    onUpdateItem(id, updates);
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const updateTileLayer = (map: L.Map, dark: boolean) => {
    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add appropriate tile layer - using free OpenStreetMap tiles
    const tileLayer = dark
      ? L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO',
          subdomains: 'abcd',
        })
      : L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        });

    tileLayer.addTo(map);
  };

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          size="sm"
          onClick={() => setIsDark(!isDark)}
          className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 shadow-ocean"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
      <div ref={mapRef} className="w-full h-full" />
      
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