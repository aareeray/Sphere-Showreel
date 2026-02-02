import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HandTracker } from './components/HandTracker';
import { ShowreelScene } from './components/ShowreelScene';
import { HandData, ShowreelItem } from './types';
import { MOCK_ITEMS } from './constants';

const App: React.FC = () => {
  const handDataRef = useRef<HandData>({
    present: false,
    distance: 0.1,
    position: { x: 0.5, y: 0.5 }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<ShowreelItem[]>(MOCK_ITEMS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup blob URLs to prevent memory leaks and "Could not load blob" errors on stale references
  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [items]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Revoke old blob URLs before creating new ones
    items.forEach(item => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });

    // Fix: Explicitly type 'file' as File to avoid 'unknown' type errors on URL.createObjectURL and file.name
    const newItems: ShowreelItem[] = Array.from(files).map((file: File, i) => ({
      id: `custom-${i}-${Date.now()}`,
      url: URL.createObjectURL(file),
      title: file.name,
      category: "Upload"
    }));

    // Minimum count for a good looking sphere
    const MIN_COUNT = 50;
    let processedItems = [...newItems];
    if (newItems.length > 0 && newItems.length < MIN_COUNT) {
      processedItems = [];
      while (processedItems.length < MIN_COUNT) {
        processedItems.push(...newItems.map((item, idx) => ({
          ...item, 
          id: `${item.id}-${processedItems.length + idx}`
        })));
      }
      processedItems = processedItems.slice(0, MIN_COUNT);
    }

    setItems(processedItems);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [items]);

  return (
    <div className="relative w-screen h-screen bg-white overflow-hidden">
      <ShowreelScene handDataRef={handDataRef} items={items} />

      <HandTracker 
        active={true} 
        handDataRef={handDataRef}
        onLoaded={() => setIsLoading(false)}
      />

      {!isLoading && (
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-md border border-black/10 shadow-sm rounded-2xl hover:bg-white hover:scale-[1.02] transition-all active:scale-98 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs font-semibold text-neutral-800">UPLOAD GALLERY</span>
          </button>
          
          <p className="px-2 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
            Pinch to zoom • Move to rotate
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-[2px] border-neutral-100 border-t-neutral-900 rounded-full animate-spin" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase">Syncing Camera</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;