export type CellStatus = 'ativa' | 'inativa';
export type LayoutType = 'compact' | 'medium' | 'spaced';

export interface CellLeader {
  id: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
}

export interface CellWithDetails {
  id: string;
  name: string;
  status: CellStatus;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  description: string | null;
  leader_id: string | null;
  church_id: string;
  created_at: string;
  updated_at: string;
  leader?: CellLeader;
  member_count?: number;
}

export const STATUS_BADGES: Record<CellStatus, {
  color: string;
  text: string;
}> = {
  ativa: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    text: 'Ativa'
  },
  inativa: {
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    text: 'Inativa'
  }
};
