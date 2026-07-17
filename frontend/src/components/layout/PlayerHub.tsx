
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth.context';
import { Avatar } from '@/components/profile/Avatar';
import { ACHIEVEMENT_LABEL, ALL_ACHIEVEMENT_CODES } from '@/constants/achievements';

function MedalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="14" r="7" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="14" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 3L7 9l5 3 5-3-2-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 11l2 4-2 1-2-1 2-4z" fill="currentColor" />
    </svg>
  );
}

function StatTile({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="aspect-square rounded-lg bg-surface-muted border border-surface-border flex flex-col items-center justify-center gap-1 p-2">
      {icon === 'LVL' ? (
        <span className="text-xs font-bold text-gold-300 leading-none">LVL</span>
      ) : (
        <img src={icon} alt="" className="w-5 h-5 opacity-90" />
      )}
      <p className="text-lg font-bold text-silver-100 leading-none">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-silver-400 text-center leading-tight">{label}</p>
    </div>
  );
}

export function PlayerHub() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <Link
      to="/profile"
      className="gold-edge-hover block w-full max-w-[13rem] bg-surface-raised border border-surface-border rounded-xl p-4 hover:bg-surface-hover transition-colors"
    >
      <div className="flex flex-col items-center gap-2 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-diamond-500/20 to-surface-muted border border-gold-500/40 shadow-gold-soft flex items-center justify-center overflow-hidden shrink-0">
          <Avatar avatarUrl={user.avatar ?? undefined} username={user.username} className="w-full h-full" />
        </div>
        <p className="text-sm font-semibold text-silver-100 truncate max-w-full">{user.username}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile icon="/assets/icons/diamond.svg" value={user.diamonds} label={t('profile_page_diamond')} />
        <StatTile icon="/assets/icons/tower.svg" value={user.tower_progress} label={t('profile_page_tower_progress')} />
        <StatTile icon="/assets/icons/map.svg" value={user.created_maps_count} label={t('profile_page_maps')} />
        <StatTile icon="LVL" value={user.level} label={t('profile_page_level')} />
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wide text-silver-400 mb-2">{t('profile_page_achievements')}</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ACHIEVEMENT_CODES.map((code) => {
            const unlocked = user.achievements.some((a) => a.code === code);
            return (
              <span key={code} title={t(`achievement.${ACHIEVEMENT_LABEL[code]}`)}>
                <MedalIcon
                  className={unlocked ? 'w-5 h-5 text-gold-300' : 'w-5 h-5 text-silver-600 opacity-40'}
                />
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
