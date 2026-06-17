import { useEffect, useState } from 'react';
import { api, type FriendPublic } from '@/services/api.service';
import { Spinner } from '@/components/ui/Spinner';

function getStatusLabel(status: FriendPublic['online_status']) {
  if (status === 'online') return 'Online';
  if (status === 'in_game') return 'In game';
  return 'Offline';
}

export function FriendsList() {
  const [friends, setFriends] = useState<FriendPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadFriends() {
    try {
      setError(null);
      const data = await api.friends.getList();
      setFriends(data);
    } catch {
      setError('Impossible de charger la liste d’amis.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFriend(userId: string) {
    try {
      await api.friends.remove(userId);
      setFriends((current) => current.filter((friend) => friend.id !== userId));
    } catch {
      setError('Impossible de supprimer cet ami.');
    }
  }

  useEffect(() => {
    void loadFriends();
  }, []);

  if (loading) {
    return (
      <div className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <section className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-fantasy text-2xl tracking-widest text-silver-100">
            Amis
          </h2>
          <p className="text-sm text-silver-400">
            Liste de tes compagnons de guilde.
          </p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {friends.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-muted/40 p-5 text-center">
          <p className="text-silver-100 font-medium">Aucun ami pour le moment.</p>
          <p className="mt-1 text-sm text-silver-400">
            Tu pourras ajouter d’autres joueurs depuis la recherche utilisateur.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {friends.map((friend) => (
            <div
              key={friend.friendship_id}
              className="flex items-center justify-between gap-4 rounded-xl border border-surface-border bg-surface-muted/40 p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-diamond-500/20 to-surface-muted border border-gold-500/40 shadow-gold-soft flex items-center justify-center text-sm font-bold font-fantasy text-gold-200 shrink-0 overflow-hidden">
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt={friend.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    friend.username.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-silver-100">
                    {friend.username}
                  </p>
                  <p className="text-xs text-silver-400">
                    {getStatusLabel(friend.online_status)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleRemoveFriend(friend.id)}
                className="rounded-lg border border-surface-border px-3 py-2 text-xs font-semibold text-silver-300 hover:border-red-400/50 hover:text-red-200 transition-colors"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}