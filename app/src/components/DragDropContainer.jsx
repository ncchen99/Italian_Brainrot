import React, { useEffect, useRef, useState } from 'react';

export default function DragDropContainer({ items, slotsCount = 4, onComplete }) {
  const [availableItems, setAvailableItems] = useState(items);
  const [slots, setSlots] = useState(Array(slotsCount).fill(null));
  const [draggingItem, setDraggingItem] = useState(null); // { source: 'pool' | 'slot', item, slotIndex? }
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [isOverPool, setIsOverPool] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef(null);
  const hasMovedRef = useRef(false);

  const placeIntoSlot = (targetIndex, payload = draggingItem) => {
    if (!payload) return;

    const { source, item, slotIndex } = payload;
    const newSlots = [...slots];
    let newAvailable = [...availableItems];

    if (source === 'slot') {
      if (slotIndex === targetIndex) {
        setDraggingItem(null);
        setDragOverSlot(null);
        return;
      }
      newSlots[slotIndex] = null;
    } else {
      newAvailable = newAvailable.filter((poolItem) => poolItem.id !== item.id);
    }

    const previousItem = newSlots[targetIndex];
    if (previousItem && previousItem.id !== item.id) {
      newAvailable.push(previousItem);
    }

    newSlots[targetIndex] = item;

    setSlots(newSlots);
    setAvailableItems(newAvailable);
    setDraggingItem(null);
    setDragOverSlot(null);

    if (newSlots.every((slot) => slot !== null) && onComplete) {
      onComplete(newSlots);
    }
  };

  const returnToPool = (payload = draggingItem) => {
    if (!payload || payload.source !== 'slot') return;
    const newSlots = [...slots];
    newSlots[payload.slotIndex] = null;
    setSlots(newSlots);
    setAvailableItems([...availableItems, payload.item]);
    setDraggingItem(null);
    setDragOverSlot(null);
    setIsOverPool(false);
  };

  const clearDragState = () => {
    setDraggingItem(null);
    setDragOverSlot(null);
    setIsOverPool(false);
    hasMovedRef.current = false;
    pointerIdRef.current = null;
  };

  const findDropTarget = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const slotEl = el?.closest?.('[data-drop-slot]');
    if (slotEl) {
      return { type: 'slot', index: Number(slotEl.getAttribute('data-drop-slot')) };
    }
    const poolEl = el?.closest?.('[data-drop-pool]');
    if (poolEl) {
      return { type: 'pool' };
    }
    return null;
  };

  const handlePointerMove = (e) => {
    if (!draggingItem || e.pointerId !== pointerIdRef.current) return;

    const movedDistance = Math.abs(e.clientX - dragStartRef.current.x) + Math.abs(e.clientY - dragStartRef.current.y);
    if (movedDistance > 6) {
      hasMovedRef.current = true;
    }

    setDragPosition({ x: e.clientX, y: e.clientY });
    const target = findDropTarget(e.clientX, e.clientY);
    if (target?.type === 'slot') {
      setDragOverSlot(target.index);
      setIsOverPool(false);
    } else {
      setDragOverSlot(null);
      setIsOverPool(target?.type === 'pool');
    }
  };

  const handlePointerUp = (e) => {
    if (!draggingItem || e.pointerId !== pointerIdRef.current) return;

    const target = findDropTarget(e.clientX, e.clientY);
    if (target?.type === 'slot') {
      placeIntoSlot(target.index, draggingItem);
      return;
    }
    if (target?.type === 'pool') {
      returnToPool(draggingItem);
      return;
    }

    // Tap fallback for mobile: tap item to auto-place / tap slot item to return.
    if (!hasMovedRef.current) {
      if (draggingItem.source === 'pool') {
        const firstEmptySlot = slots.findIndex((slot) => slot === null);
        if (firstEmptySlot !== -1) {
          placeIntoSlot(firstEmptySlot, draggingItem);
          return;
        }
      } else {
        returnToPool(draggingItem);
        return;
      }
    }

    clearDragState();
  };

  useEffect(() => {
    if (!draggingItem) return undefined;

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', clearDragState);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', clearDragState);
    };
  }, [draggingItem, slots, availableItems]);

  const startDrag = (payload, e) => {
    pointerIdRef.current = e.pointerId;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragPosition({ x: e.clientX, y: e.clientY });
    setDraggingItem(payload);
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 select-none">
      <h3 className="text-center text-sm text-gray-400 mb-4">
        按住拖曳到欄位即可放置；點一下可快速放入空欄
      </h3>
      
      {/* Available Items Pool */}
      <div
        data-drop-pool
        className={`flex justify-center gap-3 mb-8 min-h-[88px] p-4 rounded-2xl border transition-colors ${
          isOverPool ? 'bg-[#7C5CFC]/20 border-[#7C5CFC]/50' : 'bg-white/5 border-white/10'
        }`}
      >
        {availableItems.map(item => (
          <button
            key={item.id}
            onPointerDown={(e) => startDrag({ source: 'pool', item }, e)}
            className={`
              w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-transform duration-200 shadow-xl border border-white/20
              hover:scale-105 active:scale-95
            `}
            style={{ backgroundColor: item.color || '#1A1D2E' }}
          >
            {item.imageSrc ? (
              <img src={item.imageSrc} alt={item.label || item.id} className="w-12 h-12 object-contain drop-shadow-md" />
            ) : (
              item.content
            )}
          </button>
        ))}
        {availableItems.length === 0 && (
          <div className="w-full flex items-center justify-center text-gray-500 text-sm">
            已全數放置完成
          </div>
        )}
      </div>

      {/* Target Slots */}
      <div className="flex flex-col gap-3">
        {slots.map((slot, index) => (
          <div 
            key={`slot-${index}`} 
            className="flex items-center"
          >
            <span className="w-8 text-center font-bold text-gray-500 mr-2">{index + 1}.</span>
            
            <button
              data-drop-slot={index}
              onPointerDown={(e) => {
                if (slot) {
                  startDrag({ source: 'slot', item: slot, slotIndex: index }, e);
                }
              }}
              className={`
                flex-1 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-200 relative overflow-hidden
                ${slot ? 'border-transparent' : 'border-dashed border-gray-600 bg-gray-800/30'}
                ${dragOverSlot === index ? 'bg-[#7C5CFC]/20 border-[#7C5CFC]/50' : ''}
              `}
              style={{ backgroundColor: slot ? (slot.color || '#1A1D2E') : '' }}
            >
              {slot && (
                slot.imageSrc ? (
                  <img src={slot.imageSrc} alt={slot.label || slot.id} className="w-11 h-11 object-contain drop-shadow-lg" />
                ) : (
                  <span className="drop-shadow-lg">{slot.content}</span>
                )
              )}
              {!slot && dragOverSlot === index && <div className="text-sm text-[#7C5CFC]">放開以放置</div>}
            </button>
          </div>
        ))}
      </div>

      {draggingItem && (
        <div
          className="fixed z-50 w-16 h-16 rounded-xl border border-white/30 shadow-2xl flex items-center justify-center pointer-events-none"
          style={{
            left: dragPosition.x - 32,
            top: dragPosition.y - 32,
            backgroundColor: draggingItem.item.color || '#1A1D2E'
          }}
        >
          {draggingItem.item.imageSrc ? (
            <img src={draggingItem.item.imageSrc} alt={draggingItem.item.label || draggingItem.item.id} className="w-12 h-12 object-contain" />
          ) : (
            draggingItem.item.content
          )}
        </div>
      )}
    </div>
  );
}
