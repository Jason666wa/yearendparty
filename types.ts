export interface SeatData {
  id: string;
  seatNumber: number;
  attendeeName: string | null; // null if empty
}

export interface TableData {
  id: string;
  name: string;
  seats: SeatData[];
  x: number;
  y: number;
}

export interface UserState {
  isLoggedIn: boolean;
  name: string;
  foundSeat: {
    tableId: string;
    seatId: string;
    tableName: string;
    seatNumber: number;
  } | null;
}
