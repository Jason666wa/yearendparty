import React from 'react';
import { SeatData } from '../types';

interface SeatProps {
  data: SeatData;
  totalSeats: number;
  index: number;
  isHighlighted: boolean;
}

const Seat: React.FC<SeatProps> = ({ data, totalSeats, index, isHighlighted }) => {
  // Calculate position around the circle
  const angle = (index / totalSeats) * 360;
  const radius = 80; // Distance from center of table
  
  // Convert polar to cartesian
  // Adjust angle by -90 deg so the first seat is at the top
  const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
  const y = radius * Math.sin((angle - 90) * (Math.PI / 180));

  return (
    <div
      className={`absolute flex flex-col items-center justify-center transition-all duration-500`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div
        className={`
          w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold shadow-sm
          ${
            isHighlighted
              ? 'bg-festive-gold border-yellow-600 text-red-900 scale-125 z-20 animate-bounce ring-4 ring-yellow-200'
              : data.attendeeName
              ? 'bg-white border-gray-300 text-gray-700'
              : 'bg-gray-100 border-gray-200 text-gray-300'
          }
        `}
      >
        {data.seatNumber}
      </div>
      {isHighlighted && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-30">
          你是这里!
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
      <div className={`text-[10px] mt-1 font-medium bg-white/80 px-1 rounded ${isHighlighted ? 'text-festive-red font-bold' : 'text-gray-500'}`}>
        {data.attendeeName || '空'}
      </div>
    </div>
  );
};

export default Seat;
