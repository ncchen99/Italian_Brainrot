import React, { useEffect, useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function DraggableItem({ draggableId, payload, item, onClickQuickPlace }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: draggableId,
    data: payload
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    touchAction: 'none'
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ ...style, backgroundColor: item.color || '#1A1D2E' }}
      className={`
        w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-transform duration-150
        shadow-xl border border-white/20 hover:scale-105 active:scale-95
        ${isDragging ? 'opacity-40' : 'opacity-100'}
      `}
      onClick={onClickQuickPlace}
      {...listeners}
      {...attributes}
    >
      {item.imageSrc ? (
        <img src={item.imageSrc} alt={item.label || item.id} className="w-12 h-12 object-contain drop-shadow-md" />
      ) : (
        item.content
      )}
    </button>
  );
}

function PoolDropArea({ children, isActive }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool-drop' });

  return (
    <div
      ref={setNodeRef}
      className={`flex justify-center gap-3 mb-8 min-h-[88px] p-4 rounded-2xl border transition-colors ${
        isOver || isActive ? 'bg-[#7C5CFC]/20 border-[#7C5CFC]/50' : 'bg-white/5 border-white/10'
      }`}
    >
      {children}
    </div>
  );
}

function SlotDropArea({ index, slot, activeOverId, onQuickReturn }) {
  const id = `slot-drop-${index}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { target: 'slot', index } });
  const highlighted = isOver || activeOverId === id;

  return (
    <div className="flex items-center">
      <span className="w-8 text-center font-bold text-gray-500 mr-2">{index + 1}.</span>
      <div
        ref={setNodeRef}
        className={`
          flex-1 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-150 relative overflow-hidden
          ${slot ? 'border-transparent' : 'border-dashed border-gray-600 bg-gray-800/30'}
          ${highlighted ? 'bg-[#7C5CFC]/20 border-[#7C5CFC]/50' : ''}
        `}
        style={{ backgroundColor: slot ? (slot.color || '#1A1D2E') : '' }}
      >
        {slot ? (
          <DraggableItem
            draggableId={`slot-item-${index}-${slot.id}`}
            payload={{ source: 'slot', item: slot, slotIndex: index }}
            item={slot}
            onClickQuickPlace={() => onQuickReturn(index)}
          />
        ) : null}
        {!slot && highlighted ? <div className="text-sm text-[#7C5CFC]">放開以放置</div> : null}
      </div>
    </div>
  );
}

export default function DragDropContainer({ items, slotsCount = 4, onComplete, onChange }) {
  const [availableItems, setAvailableItems] = useState(items);
  const [slots, setSlots] = useState(Array(slotsCount).fill(null));
  const [activePayload, setActivePayload] = useState(null);
  const [activeOverId, setActiveOverId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    setAvailableItems(items);
    setSlots(Array(slotsCount).fill(null));
  }, [items, slotsCount]);

  useEffect(() => {
    if (onChange) {
      onChange(slots);
    }
  }, [onChange, slots]);

  const placeIntoSlot = (payload, targetIndex) => {
    if (!payload) return;

    const { source, item, slotIndex } = payload;
    const newSlots = [...slots];
    let newAvailable = [...availableItems];

    if (source === 'slot') {
      if (slotIndex === targetIndex) return;
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

    if (newSlots.every((slot) => slot !== null) && onComplete) {
      onComplete(newSlots);
    }
  };

  const returnToPool = (payload) => {
    if (!payload || payload.source !== 'slot') return;

    const newSlots = [...slots];
    newSlots[payload.slotIndex] = null;
    setSlots(newSlots);
    setAvailableItems([...availableItems, payload.item]);
  };

  const handleDragStart = (event) => {
    setActivePayload(event.active?.data?.current || null);
  };

  const handleDragOver = (event) => {
    setActiveOverId(event.over?.id || null);
  };

  const resetDragState = () => {
    setActivePayload(null);
    setActiveOverId(null);
  };

  const handleDragEnd = (event) => {
    const overId = event.over?.id;
    if (!overId || !activePayload) {
      resetDragState();
      return;
    }

    if (overId === 'pool-drop') {
      returnToPool(activePayload);
      resetDragState();
      return;
    }

    if (String(overId).startsWith('slot-drop-')) {
      const targetIndex = Number(String(overId).replace('slot-drop-', ''));
      if (Number.isFinite(targetIndex)) {
        placeIntoSlot(activePayload, targetIndex);
      }
    }

    resetDragState();
  };

  const handlePoolQuickPlace = (item) => {
    const firstEmptySlot = slots.findIndex((slot) => slot === null);
    if (firstEmptySlot === -1) return;
    placeIntoSlot({ source: 'pool', item }, firstEmptySlot);
  };

  const handleSlotQuickReturn = (slotIndex) => {
    const slot = slots[slotIndex];
    if (!slot) return;
    returnToPool({ source: 'slot', item: slot, slotIndex });
  };

  const overlayItem = useMemo(() => activePayload?.item || null, [activePayload]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragCancel={resetDragState}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full max-w-sm mx-auto p-4 select-none">
        <h3 className="text-center text-sm text-gray-400 mb-4">
          拖曳到欄位即可放置；點一下可快速放入空欄
        </h3>

        <PoolDropArea isActive={activeOverId === 'pool-drop'}>
          {availableItems.map((item) => (
            <DraggableItem
              key={item.id}
              draggableId={`pool-item-${item.id}`}
              payload={{ source: 'pool', item }}
              item={item}
              onClickQuickPlace={() => handlePoolQuickPlace(item)}
            />
          ))}
          {availableItems.length === 0 ? (
            <div className="w-full flex items-center justify-center text-gray-500 text-sm">
              已全數放置完成
            </div>
          ) : null}
        </PoolDropArea>

        <div className="flex flex-col gap-3">
          {slots.map((slot, index) => (
            <SlotDropArea
              key={`slot-${index}`}
              index={index}
              slot={slot}
              activeOverId={activeOverId}
              onQuickReturn={handleSlotQuickReturn}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {overlayItem ? (
          <div
            className="w-16 h-16 rounded-xl border border-white/30 shadow-2xl flex items-center justify-center"
            style={{ backgroundColor: overlayItem.color || '#1A1D2E' }}
          >
            {overlayItem.imageSrc ? (
              <img src={overlayItem.imageSrc} alt={overlayItem.label || overlayItem.id} className="w-12 h-12 object-contain" />
            ) : (
              overlayItem.content
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
