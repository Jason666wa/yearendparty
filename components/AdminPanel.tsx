import React, { useState, useRef, useEffect } from 'react';
import { TableData } from '../types';
import Table from './Table';
import EditModal from './EditModal';

interface AdminPanelProps {
  tables: TableData[];
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  onSave: (tables: TableData[]) => void;
  onClose: () => void;
}

type DragMode = 'idle' | 'table' | 'canvas';

interface DragState {
  mode: DragMode;
  targetId?: string;
  startX: number;
  startY: number;
  initialItemX?: number;
  initialItemY?: number;
  initialScrollX?: number;
  initialScrollY?: number;
  hasMoved: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ tables, setTables, onSave, onClose }) => {
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Unified Drag State
  const [dragState, setDragState] = useState<DragState>({
    mode: 'idle',
    startX: 0,
    startY: 0,
    hasMoved: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Setup Global Event Listeners for Dragging
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (dragState.mode === 'idle') return;

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaX = clientX - dragState.startX;
      const deltaY = clientY - dragState.startY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setDragState(prev => ({ ...prev, hasMoved: true }));
      }

      if (dragState.mode === 'table' && dragState.targetId) {
        e.preventDefault();
        setHasUnsavedChanges(true);
        setTables(prev => prev.map(t => {
          if (t.id !== dragState.targetId) return t;
          return {
            ...t,
            x: (dragState.initialItemX || 0) + deltaX,
            y: (dragState.initialItemY || 0) + deltaY
          };
        }));
      } else if (dragState.mode === 'canvas' && containerRef.current) {
        containerRef.current.scrollLeft = (dragState.initialScrollX || 0) - deltaX;
        containerRef.current.scrollTop = (dragState.initialScrollY || 0) - deltaY;
      }
    };

    const handleGlobalUp = () => {
      setDragState(prev => ({ ...prev, mode: 'idle' }));
    };

    if (dragState.mode !== 'idle') {
      window.addEventListener('mousemove', handleGlobalMove, { passive: false });
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [dragState, setTables]);

  const startTableDrag = (e: React.MouseEvent | React.TouchEvent, table: TableData) => {
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setDragState({
      mode: 'table',
      targetId: table.id,
      startX: clientX,
      startY: clientY,
      initialItemX: table.x,
      initialItemY: table.y,
      hasMoved: false,
    });
  };

  const startCanvasDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && (e as React.MouseEvent).button !== 0) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    setDragState({
      mode: 'canvas',
      startX: clientX,
      startY: clientY,
      initialScrollX: containerRef.current?.scrollLeft || 0,
      initialScrollY: containerRef.current?.scrollTop || 0,
      hasMoved: false,
    });
  };

  const handleTableClick = (e: React.MouseEvent, table: TableData) => {
    e.stopPropagation();
    if (!dragState.hasMoved) {
      setEditingTable(table);
    }
  };

  const handleAddTable = () => {
    const scrollX = containerRef.current?.scrollLeft || 0;
    const scrollY = containerRef.current?.scrollTop || 0;
    
    const newTable: TableData = {
      id: `t-${Date.now()}`,
      name: '新桌子',
      x: scrollX + 300 + (Math.random() * 50),
      y: scrollY + 300 + (Math.random() * 50),
      seats: Array.from({ length: 8 }).map((_, i) => ({
        id: `s-${Date.now()}-${i}`,
        seatNumber: i + 1,
        attendeeName: null,
      })),
    };
    setTables([...tables, newTable]);
    setHasUnsavedChanges(true);
  };

  const handleSaveTable = (updated: TableData) => {
    setTables(tables.map(t => t.id === updated.id ? updated : t));
    setHasUnsavedChanges(true);
  };

  const handleDeleteTable = (id: string) => {
    setTables(tables.filter(t => t.id !== id));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = () => {
    onSave(tables);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col select-none">
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm z-20">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
           🛠️ 管理员模式
           {hasUnsavedChanges && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">未保存</span>}
        </h2>
        <div className="flex gap-2">
           <button 
             onClick={handleSaveChanges}
             className={`text-white text-xs px-4 py-2 rounded shadow transition-all ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700 animate-pulse' : 'bg-blue-400'}`}
           >
             💾 保存布局
           </button>
           <div className="w-px h-6 bg-gray-300 mx-1"></div>
           <button 
             onClick={handleAddTable}
             className="bg-green-600 text-white text-xs px-3 py-2 rounded shadow hover:bg-green-700 active:scale-95 transition-transform"
           >
             + 添加桌子
           </button>
           <button 
             onClick={onClose}
             className="bg-gray-800 text-white text-xs px-3 py-2 rounded shadow hover:bg-gray-900 active:scale-95 transition-transform"
           >
             退出
           </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto relative bg-stone-50 ${dragState.mode === 'canvas' ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={startCanvasDrag}
        onTouchStart={startCanvasDrag}
        style={{ 
          backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}
      >
        <div className="min-w-[1500px] min-h-[1500px] relative">
          {tables.map(table => (
            <Table
              key={table.id}
              data={table}
              highlightedSeatId={null}
              className="absolute hover:z-50"
              style={{
                left: table.x,
                top: table.y,
                cursor: dragState.mode === 'table' && dragState.targetId === table.id ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
              onMouseDown={(e) => startTableDrag(e, table)}
              onTouchStart={(e) => startTableDrag(e, table)}
              onClick={(e) => handleTableClick(e as any, table)}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded shadow text-xs text-gray-500 pointer-events-none border border-gray-200">
        <p>🖱️ 拖动空白处移动画布</p>
        <p>📦 拖动桌子调整位置</p>
        <p>👆 点击桌子编辑信息</p>
      </div>

      {editingTable && (
        <EditModal
          table={editingTable}
          onSave={handleSaveTable}
          onDelete={handleDeleteTable}
          onClose={() => setEditingTable(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
