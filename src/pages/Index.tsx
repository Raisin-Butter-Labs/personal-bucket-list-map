import React, { useState, useEffect, useRef } from "react";
import { InteractiveMap } from "@/components/InteractiveMap";
import { BucketListItem } from "@/types/bucketList";
import { BucketListSidebar } from "@/components/BucketListSidebar";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Index = () => {
    const [bucketList, setBucketList] = useState<BucketListItem[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("bucketList");
        if (saved) {
            try {
                setBucketList(JSON.parse(saved));
            } catch (error) {
                console.error("Error loading bucket list:", error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("bucketList", JSON.stringify(bucketList));
    }, [bucketList]);

    const addItem = (newItem: Omit<BucketListItem, "id" | "dateAdded">) => {
        const item: BucketListItem = {
            ...newItem,
            id: Date.now().toString(),
            dateAdded: new Date().toISOString(),
        };
        setBucketList((prev) => [...prev, item]);
        toast({
            title: "Location Added!",
            description: "Click on the marker to edit details.",
        });
    };

    const updateItem = (id: string, updates: Partial<BucketListItem>) => {
        setBucketList((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, ...updates } : item
            )
        );
    };

    const deleteItem = (id: string) => {
        setBucketList((prev) => prev.filter((item) => item.id !== id));
        toast({
            title: "Location Removed",
            description: "The location has been deleted from your bucket list.",
        });
    };

    const importItems = (items: BucketListItem[]) => {
        setBucketList(items);
    };

    return (
        <div className="flex h-screen bg-background relative">
            {/* Sidebar */}
            <div
                className={`
                ${
                    sidebarOpen
                        ? "translate-x-0"
                        : "-translate-x-full lg:-translate-x-full"
                }
                fixed lg:relative
                inset-y-0 left-0
                z-[1002]
                w-64 sm:w-72 lg:w-80
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? "block" : "hidden lg:hidden"}
                `}
            >
                <BucketListSidebar
                    bucketList={bucketList}
                    onUpdateItem={updateItem}
                    onDeleteItem={deleteItem}
                    onImport={importItems}
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                />
            </div>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[1001] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Map container */}
            <div
                className={`
                    flex-1 
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? "lg:ml-0" : "ml-0"}
                `}
                ref={mapRef}
            >
                {!sidebarOpen && (
                    <Button
                        size="sm"
                        onClick={() => setSidebarOpen(true)}
                        className="fixed top-20 left-2 z-[1001] shadow-lg bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>
                )}

                <InteractiveMap
                    bucketList={bucketList}
                    onAddItem={addItem}
                    onUpdateItem={updateItem}
                    onDeleteItem={deleteItem}
                    sidebarOpen={sidebarOpen}
                />
            </div>
        </div>
    );
};

export default Index;
