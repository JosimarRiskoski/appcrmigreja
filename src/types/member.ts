export type MemberStatus = 'ativo' | 'inativo' | 'visitante';
export type LayoutType = 'compact' | 'medium' | 'spaced';

export interface Cell {
  id: string;
  name: string;
  leader_id: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
}

export interface Member {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  status: MemberStatus;
  baptized: boolean;
  member_since: string | null;
  photo_url: string | null;
  cell_id: string | null;
  cell?: Cell;
  notes?: string | null;
  address?: string | null;
  city?: string | null;
  zip_code?: string | null;
  created_at?: string | null;
}

export const STATUS_BADGES: Record<MemberStatus, {
  color: string;
  text: string;
}> = {
  ativo: {
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    text: 'Ativo'
  },
  inativo: {
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    text: 'Inativo'
  },
  visitante: {
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    text: 'Visitante'
  }
};
