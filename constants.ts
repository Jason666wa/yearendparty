import { TableData } from './types';

// Helper to generate seats for a table
const generateSeats = (tablePrefix: string, count: number, startId: number, names: string[]): any[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `${tablePrefix}-s${i + 1}`,
    seatNumber: i + 1,
    attendeeName: names[i] || null,
  }));
};

// Initial layout for a roughly 800x800 space
export const MOCK_TABLES: TableData[] = [
  {
    id: 't1',
    name: 'VIP 主桌',
    x: 300,
    y: 50,
    seats: generateSeats('t1', 8, 0, ['张总', '李总', '王董', '赵总', '孙总', 'Alice', 'Bob', 'Charlie']),
  },
  {
    id: 't2',
    name: '技术部 (Tech)',
    x: 100,
    y: 350,
    seats: generateSeats('t2', 10, 0, ['张三', '李四', '王五', '赵六', 'Dev1', 'Dev2', 'Dev3', 'Dev4', 'Dev5', 'Dev6']),
  },
  {
    id: 't3',
    name: '市场部 (Sales)',
    x: 500,
    y: 350,
    seats: generateSeats('t3', 10, 0, ['Sarah', 'Mike', 'Jenny', 'Tom', 'Jerry', 'Sales1', 'Sales2', 'Sales3', 'Sales4', 'Sales5']),
  },
  {
    id: 't4',
    name: '运营部 (Ops)',
    x: 100,
    y: 650,
    seats: generateSeats('t4', 10, 0, ['OpsLead', 'Ops2', 'Ops3', 'Ops4', 'Ops5', 'Ops6', 'Ops7', 'Ops8', 'Ops9', 'Ops10']),
  },
  {
    id: 't5',
    name: '新人桌 (New)',
    x: 500,
    y: 650,
    seats: generateSeats('t5', 8, 0, ['Intern1', 'Intern2', 'Intern3', 'Intern4', 'Intern5', 'Intern6', 'Intern7', 'Intern8']),
  },
];
