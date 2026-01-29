export type EventStatus = 'today' | 'upcoming' | 'week' | 'future' | 'past';
export type LayoutType = 'compact' | 'medium' | 'spaced';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: EventStatus;
  type?: string;
  description?: string;
}

export const STATUS_BADGES = {
  today: {
    color: 'bg-red-100 text-red-700',
    icon: '🔴',
    text: 'HOJE'
  },
  upcoming: {
    color: 'bg-green-100 text-green-700',
    icon: '🟢',
    text: 'Próximo'
  },
  week: {
    color: 'bg-yellow-100 text-yellow-700',
    icon: '🟡',
    text: 'Esta Semana'
  },
  future: {
    color: 'bg-gray-100 text-gray-600',
    icon: '⚪',
    text: 'Futuro'
  },
  past: {
    color: 'bg-red-100 text-red-700',
    icon: '⛔',
    text: 'Encerrado'
  }
} as const;
