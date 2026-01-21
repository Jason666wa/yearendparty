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
}

const Table: React.FC<TableProps> = ({ data, highlightedSeatId, style, onClick, onMouseDown, onTouchStart, className }) => {
  const isTargetTable = data.seats.some(s => s.id === highlightedSeatId);

  return (
    <div 
      className={`
        flex flex-col items-center justify-center
        transition-all duration-700
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

export default Table;