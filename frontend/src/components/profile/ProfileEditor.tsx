import { useState } from 'react';
import { api } from '@/services/api.service';
import { useAuth } from '@/context/auth.context';
import { useTranslation } from 'react-i18next';

const AVATARS = [
  '/assets/avatars/Blue_Mage.png',
  '/assets/avatars/Knight_Vert.png',
  '/assets/avatars/Range_or.png',
  '/assets/avatars/Rogue_Violet.png',
];

export function ProfileEditor() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

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

      setMessage(t('profile_editor_update_success'));
    } catch {
      setMessage(t('profile_editor_update_error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6">
      <h2 className="font-fantasy text-2xl text-silver-100 mb-4">
        {t('profile_editor_update_profile')}
      </h2>

      <div className="mb-6">
        <label className="block text-silver-400 mb-2">
          {t('profile_editor_username')}
        </label>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-surface-border bg-neutral-900 px-4 py-2 text-gold-100"
        />
      </div>

      <div className="mb-6">
        <p className="text-silver-400 mb-3">
          {t('profile_editor_avatar')}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {AVATARS.map((avatar) => (
            <button
              key={avatar}
              type="button"
			  aria-label={`Choisir l'avatar ${avatar}`}
              onClick={() => setSelectedAvatar(avatar)}
              className={`rounded-xl border p-2 ${
                selectedAvatar === avatar
                  ? 'border-gold-500'
                  : 'border-surface-border'
              }`}
            >
              <img
				src={avatar}
				alt={`Avatar ${avatar}`}
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
        {saving ? t('profile_editor_saving') : t('profile_editor_save')}
      </button>

      {message && (
        <p className="mt-3 text-sm text-silver-400">
          {message}
        </p>
      )}
    </div>
  );
}