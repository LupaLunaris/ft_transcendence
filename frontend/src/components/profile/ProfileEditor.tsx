import { useState } from 'react';
import { api } from '@/services/api.service';
import { useAuth } from '@/context/auth.context';

const AVATARS = [
  '/assets/avatars/Blue_Mage.png',
  '/assets/avatars/Knight_Vert.png',
  '/assets/avatars/Range_or.png',
  '/assets/avatars/Rogue_Violet.png',
];

export function ProfileEditor() {
  const { user, updateUser } = useAuth();

  const [username, setUsername] = useState(user?.username ?? '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar ?? AVATARS[0]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    try {
      setSaving(true);

      const updatedUser = await api.auth.updateProfile({
        username,
        avatar: selectedAvatar,
      });

      updateUser(updatedUser);

      setMessage('Profil mis à jour.');
    } catch {
      setMessage('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6">
      <h2 className="font-fantasy text-2xl text-silver-100 mb-4">
        Modifier le profil
      </h2>

      <div className="mb-6">
        <label className="block text-silver-400 mb-2">
          Nom d'utilisateur
        </label>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-surface-border bg-surface-muted px-4 py-2 text-silver-100"
        />
      </div>

      <div className="mb-6">
        <p className="text-silver-400 mb-3">
          Choisir un avatar
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              onClick={() => setSelectedAvatar(avatar)}
              className={`rounded-xl border p-2 ${
                selectedAvatar === avatar
                  ? 'border-gold-500'
                  : 'border-surface-border'
              }`}
            >
              <img
                src={avatar}
                alt=""
                className="w-full rounded-lg"
              />
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => void handleSave()}
        disabled={saving}
        className="rounded-lg bg-gold-500/20 border border-gold-500 px-4 py-2 text-gold-300"
      >
        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>

      {message && (
        <p className="mt-3 text-sm text-silver-400">
          {message}
        </p>
      )}
    </div>
  );
}