import { useState } from 'react';
import { api } from '@/services/api.service';
import { useAuth } from '@/context/auth.context';
import { Input } from '@/components/ui/Input';
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
  const [file, setFile] = useState<File | null>(null);

	async function handleSave() {
	try {
		setSaving(true);

		let updatedUser;

		// 🔥 CAS 1 — upload fichier
		if (file) {
		const formData = new FormData();
		formData.append("avatar", file);
		formData.append("username", username);

		const res = await fetch("/api/users/avatar", {
			method: "POST",
			headers: {
			Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
			body: formData,
		});

		if (!res.ok) throw new Error("Upload failed");

		updatedUser = await res.json();
		}

		// 🔥 CAS 2 — avatars prédéfinis
		else {
		updatedUser = await api.auth.updateProfile({
			username,
			avatar: selectedAvatar,
		});
		}

		updateUser(updatedUser);
		setPreview(null);
		setFile(null);

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
		<Input
  		  label={t('profile_editor_username')}
		  value={username}
		  onChange={(e) => setUsername(e.target.value)}
		  className="w-full rounded-lg border border-surface-border bg-neutral-900 px-4 py-2 text-gold-100"
		/>
	  </div>

	  <div className="mb-6">
		<p className="text-silver-400 mb-3">
		  {t('profile_editor_avatar')}
		</p>

		<div className="mb-4 flex flex-col items-center gap-2">
		<div className="relative">
			<div className="w-24 h-24 rounded-full overflow-hidden border border-gold-500/40">
			<img
				key={preview || selectedAvatar}
				src={preview ? preview : selectedAvatar}
				alt={user?.username ?? username}
				className="w-full h-full object-cover"
			/>
			</div>

			{preview && (
			<span className="absolute -top-2 -right-2 bg-gold-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold">
				Preview
			</span>
			)}
		</div>
		</div>

		<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
		  {AVATARS.map((avatar) => (
			<button
			  key={avatar}
			  type="button"
			  aria-label={`Choisir l'avatar ${avatar}`}
			  onClick={() => {
				setSelectedAvatar(avatar);
				setPreview(null);
				}}
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
		<div className="mt-4">

		<Input
			label={t('profile_editor_upload_avatar')}
			type="file"
			accept="image/*"
			onChange={(e) => {
				const selectedFile = e.target.files?.[0];
				if (!selectedFile) return;

				setFile(selectedFile);

				if (preview) URL.revokeObjectURL(preview);
				setPreview(URL.createObjectURL(selectedFile));
			}}
			className="text-sm text-silver-300"
		/>
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