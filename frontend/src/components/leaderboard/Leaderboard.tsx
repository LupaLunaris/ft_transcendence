import type { LeaderboardEntry } from '@ft/shared';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/profile/Avatar';
import { Spinner } from '@/components/ui/Spinner';

const RANK_MEDAL: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

interface LeaderboardProps {
  title: string;
  entries: LeaderboardEntry[];
  loading: boolean;
  highlightUserId?: string;
  className?: string;
}

export function Leaderboard({ title, entries, loading, highlightUserId, className }: LeaderboardProps) {
  const { t } = useTranslation();

  return (
    <div className={`bg-surface-raised border border-surface-border rounded-xl p-4 flex flex-col gap-3 [@media(orientation:landscape)_and_(pointer:coarse)]:hidden ${className ?? ''}`}>
      <h2 className="font-fantasy text-lg text-gold-300">{title}</h2>

      {loading && (
        <div className="flex justify-center py-4">
          <Spinner size="sm" className="text-deep-400" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-silver-400">{t('leaderboard.empty')}</p>
      )}

      {!loading && entries.length > 0 && (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.user_id}
              className={[
                'flex items-center gap-2 rounded-lg px-2 py-1.5',
                entry.user_id === highlightUserId ? 'bg-deep-700/60' : '',
              ].join(' ')}
            >
              <span className="w-5 shrink-0 text-center text-sm text-silver-400">
                {RANK_MEDAL[entry.rank] ?? entry.rank}
              </span>
              <Avatar
                avatarUrl={entry.avatar ?? undefined}
                username={entry.username}
                className="w-6 h-6 shrink-0"
              />
              <span className="flex-1 truncate text-sm text-silver-100">{entry.username}</span>
              <span className="text-sm font-semibold text-gold-300">
                {entry.completion_time_ms !== undefined
                  ? t('leaderboard.time_value', { time: (entry.completion_time_ms / 1000).toFixed(2) })
                  : t('leaderboard.points_value', { points: entry.points })}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
