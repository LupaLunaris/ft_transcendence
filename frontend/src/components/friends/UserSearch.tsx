import { useState } from 'react';
import { api, type UserSearchResult } from '@/services/api.service';
import { useTranslation } from 'react-i18next';

interface UserSearchProps {
  onFriendAdded: () => void;
}

export function UserSearch({ onFriendAdded }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setResults([]);
      setError(t('friends_search_characters'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const users = await api.users.search(trimmedQuery);
      setResults(users);
    } catch {
      setError(t('friends_search_error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddFriend(userId: string) {
    try {
      setError(null);

      await api.friends.add(userId);
      onFriendAdded();

      setResults((current) => current.filter((user) => user.id !== userId));
    } catch {
      setError(t('friends_search_add_friend_error'));
    }
  }

  return (
    <div className="mb-5 rounded-xl border border-surface-border bg-surface-muted/40 p-4">
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t('friends_search_search_player')}
          placeholder={t('friends_search_search_player')}
          className="flex-1 rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-sm text-silver-100 placeholder:text-silver-500 outline-none focus:border-gold-500/60"
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/20 disabled:opacity-50"
        >
          {loading ? t('friends_search_searching') : t('friends_search_search')}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-surface-border bg-surface-raised p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-diamond-500/20 to-surface-muted border border-gold-500/40 flex items-center justify-center text-sm font-bold font-fantasy text-gold-200 overflow-hidden shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.username.slice(0, 2).toUpperCase()
                  )}
                </div>

                <p className="truncate font-semibold text-silver-100">
                  {user.username}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleAddFriend(user.id)}
                className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-silver-300 hover:border-gold-500/50 hover:text-gold-300 transition-colors"
              >
                {t('friends_search_add')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}