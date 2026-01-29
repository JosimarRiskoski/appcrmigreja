export type MinistryStatus = 'active' | 'inactive';
export type LayoutType = 'compact' | 'medium' | 'spaced';

export interface MinistryMember {
  member_id: string;
  ministry_id: string;
  joined_at: string;
  member?: {
    id: string;
    full_name: string;
    photo_url: string | null;
  };
}

export interface Ministry {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  leader?: {
    id: string;
    full_name: string;
    photo_url: string | null;
  };
  ministry_members?: MinistryMember[];
  _count?: {
    members: number;
  };
}

export const DEFAULT_COLORS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#10b981', label: 'Verde' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#84cc16', label: 'Lima' },
];
