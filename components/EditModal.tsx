import React, { useState } from 'react';
import { TableData, SeatData } from '../types';

interface EditModalProps {
  table: TableData;
  onSave: (updatedTable: TableData) => void;
  onDelete: (tableId: string) => void;
  onClose: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ table, onSave, onDelete, onClose }) => {
  const [tableName, setTableName] = useState(table.name);
  const [seats, setSeats] = useState<SeatData[]>(table.seats);

  const handleSeatNameChange = (seatId: string, newName: string) => {
    setSeats(seats.map(s => s.id === seatId ? { ...s, attendeeName: newName } : s));
  };

  const addSeat = () => {
    const newSeatNumber = seats.length + 1;
    const newSeat: SeatData = {
      id: `${table.id}-s${Date.now()}`,
      seatNumber: newSeatNumber,
      attendeeName: '',
    };
    setSeats([...seats, newSeat]);
  };

  const removeSeat = (seatId: string) => {
    setSeats(seats.filter(s => s.id !== seatId).map((s, i) => ({...s, seatNumber: i + 1})));
  };

  const handleSave = () => {
    onSave({
      ...table,
      name: tableName,
      seats: seats,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <h3 className="font-bold text-lg">编辑桌子</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">桌名</label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-medium text-gray-700">座位列表 ({seats.length})</label>
               <button 
                onClick={addSeat}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
               >
                 + 添加座位
               </button>
            </div>
            
            <div className="space-y-2">
              {seats.map((seat, idx) => (
                <div key={seat.id} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-gray-400 font-mono">#{idx + 1}</span>
                  <input
                    type="text"
                    placeholder="空位"
                    value={seat.attendeeName || ''}
                    onChange={(e) => handleSeatNameChange(seat.id, e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded text-sm focus:border-blue-500 outline-none"
                  />
                  <button 
                    onClick={() => removeSeat(seat.id)}
                    className="text-red-400 hover:text-red-600 text-sm px-2"
                    title="删除座位"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between">
          <button 
            onClick={() => {
              if(confirm('确定要删除这张桌子吗?')) {
                onDelete(table.id);
                onClose();
              }
            }}
            className="text-red-600 text-sm hover:underline"
          >
            删除此桌
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm"
            >
              取消
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              保存更改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
