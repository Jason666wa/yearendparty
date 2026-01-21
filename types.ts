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

export interface PhotoData {
  id: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  uploaderIp: string;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string; // 前端使用的图片URL
  hasVoted?: boolean; // 当前IP是否已投票
}

export interface VotingStatus {
  votingEnabled: boolean;
  votingStopped: boolean;
}
