export enum BookStatus {
  READING = 'READING',
  READ = 'READ',
  WANT_TO_READ = 'WANT_TO_READ',
  ABANDONED = 'ABANDONED',
  POSTPONED = 'POSTPONED'
}

export interface ReadingSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  startPage?: number;
  endPage?: number;
  pagesRead?: number;
  startPercentage?: number;
  endPercentage?: number;
  percentageRead?: number;
}

export interface StatusChange {
  timestamp: string;
  previousStatus: BookStatus;
  newStatus: BookStatus;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  year: number | string;
  coverUrl: string;
  status: BookStatus;
  rating: number;
  startDate: string;
  endDate: string;
  description?: string;
  totalPages?: number;
  currentPage?: number;
  currentPercentage?: number;
  isPartOfSeries?: boolean;
  franchiseIds?: string[];
  sessions?: ReadingSession[];
  statusHistory?: StatusChange[];
  inQueue?: boolean;
}

export interface Franchise {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  bookIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ViewType =
  | 'catalog'
  | 'collections'
  | 'calendar'
  | 'statistics'
  | 'reading'
  | 'blackjack';
