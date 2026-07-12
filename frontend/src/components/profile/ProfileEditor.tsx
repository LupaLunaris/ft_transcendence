import { useState } from 'react';
import { api } from '@/services/api.service';
import { useAuth } from '@/context/auth.context';
import { useTranslation } from 'react-i18next';

const AVATARS = [
  '/assets/avatars/Jerem_avatar.png',
  '/assets/avatars/Martin_avatar2.png',
  '/assets/avatars/Jen_avatar.png',
  '/assets/avatars/Elise_avatar.png',
];

export function ProfileEditor() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState(user?.username ?? '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar ?? AVATARS[0]);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');

  async function handleSave() {
    const normalizedUsername = username.trim();

    if (!/^[a-zA-Z0-9]{3,20}$/.test(normalizedUsername)) {
      setUsernameError(t('profile_editor_username_validation'));
      return;
    }

    try {
      setSaving(true);
      setUsernameError('');
      setMessage('');

      const updatedUser = await api.auth.updateProfile({
        username: normalizedUsername,
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
        <label htmlFor="profile-username" className="block text-silver-400 mb-2">
          {t('profile_editor_username')}
        </label>

        <input
          id="profile-username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (usernameError) setUsernameError('');
          }}
          aria-invalid={Boolean(usernameError)}
          aria-describedby={usernameError ? 'profile-username-error' : undefined}
          className="w-full rounded-lg border border-surface-border bg-neutral-900 px-4 py-2 text-gold-100"
        />
        {usernameError && (
          <p id="profile-username-error" className="mt-2 text-sm text-coral-400" role="alert">
            {usernameError}
          </p>
        )}
      </div>

      <div className="mb-6">
        <p className="text-silver-400 mb-3">
          {t('profile_editor_avatar')}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {AVATARS.map((avatar, index) => (
            <button
              key={avatar}
              type="button"
              aria-label={t('profile_editor_avatar_option', { number: index + 1 })}
              onClick={() => setSelectedAvatar(avatar)}
              className={`rounded-xl border p-2 ${
                selectedAvatar === avatar
                  ? 'border-gold-500'
                  : 'border-surface-border'
              }`}
            >
              <img
                src={avatar}
                alt={t('profile_editor_avatar_option', { number: index + 1 })}
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
        <p className="mt-3 text-sm text-silver-400" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
