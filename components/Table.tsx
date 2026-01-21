import React from 'react';
import { TableData } from '../types';
import Seat from './Seat';

interface TableProps {
  data: TableData;
  highlightedSeatId: string | null;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  className?: string;
  dataTableId?: string;
  isDragging?: boolean;
}

const Table: React.FC<TableProps> = ({ 
  data, 
  highlightedSeatId, 
  style, 
  onClick, 
  onMouseDown, 
  onTouchStart, 
  className,
  dataTableId,
  isDragging = false
}) => {
  const isTargetTable = data.seats.some(s => s.id === highlightedSeatId);

  return (
    <div 
      data-table-id={dataTableId}
      className={`
        flex flex-col items-center justify-center
        ${isDragging ? '' : 'transition-all duration-700'}
        ${isTargetTable ? 'opacity-100 scale-100 z-30' : highlightedSeatId ? 'opacity-40 scale-90 grayscale z-0' : 'opacity-100 z-10'}
        ${className || ''}
      `}
      style={{ 
        width: '240px', 
        height: '240px',
        ...style 
      }}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Table Surface */}
      <div className={`
        w-32 h-32 rounded-full flex items-center justify-center text-center p-2 z-10 shadow-lg border-4 transition-colors
        ${isTargetTable 
            ? 'bg-festive-red border-festive-gold text-white' 
            : 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100'
        }
        cursor-pointer
      `}>
        <div className="flex flex-col select-none">
          <span className="font-bold text-sm leading-tight">{data.name}</span>
          <span className="text-[10px] opacity-80 mt-1">{data.seats.length} Seats</span>
        </div>
      </div>

      {/* Seats Ring */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full flex items-center justify-center">
             {data.seats.map((seat, index) => (
                <Seat
                  key={seat.id}
                  data={seat}
                  totalSeats={data.seats.length}
                  index={index}
                  isHighlighted={seat.id === highlightedSeatId}
                />
             ))}
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(Table, (prevProps, nextProps) => {
  // Only re-render if these props change
  if (prevProps.data.id !== nextProps.data.id) return false;
  if (prevProps.data.x !== nextProps.data.x) return false;
  if (prevProps.data.y !== nextProps.data.y) return false;
  if (prevProps.data.name !== nextProps.data.name) return false;
  if (prevProps.data.seats.length !== nextProps.data.seats.length) return false;
  if (prevProps.highlightedSeatId !== nextProps.highlightedSeatId) return false;
  if (prevProps.isDragging !== nextProps.isDragging) return false;
  
  // Check if seats have changed (only check attendeeName which is what matters for display)
  if (prevProps.data.seats.length === nextProps.data.seats.length) {
    for (let i = 0; i < prevProps.data.seats.length; i++) {
      if (prevProps.data.seats[i].attendeeName !== nextProps.data.seats[i].attendeeName) {
        return false;
      }
      if (prevProps.data.seats[i].seatNumber !== nextProps.data.seats[i].seatNumber) {
        return false;
      }
    }
  }
  
  return true;
});