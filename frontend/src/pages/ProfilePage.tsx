
import { Layout } from '@/components/layout/Layout';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/auth.context';
import { useTranslation } from 'react-i18next';
import { FriendsList } from '@/components/friends/FriendsList';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { Avatar } from '@/components/profile/Avatar';

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
	return (
	  <Layout>
		<div className="py-20 flex justify-center">
		  <Spinner />
		</div>
	  </Layout>
	);
  }

  if (!user) {
	return (
	  <Layout>
		<div className="max-w-2xl mx-auto px-4 py-12 text-center text-white/60">
		  <p>
			{t('profile_page_offline_error')}
		  </p>
		</div>
	  </Layout>
	);
  }

	return (
	<Layout>
		<div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8">
		<div className="text-center space-y-3">
			<h1 className="guild-title-strong font-fantasy text-4xl tracking-widest">
			{t('profile_page.profile')}
			</h1>
			<p className="text-silver-400 text-sm">
				{t('profile_page_info')}
			</p>
		</div>

		<div className="gold-edge bg-surface-raised border border-surface-border rounded-xl p-6">
			<div className="flex flex-col sm:flex-row items-center gap-6">
			<div className="w-24 h-24 rounded-full bg-gradient-to-br from-diamond-500/20 to-surface-muted border border-gold-500/40 shadow-gold-soft flex items-center justify-center shrink-0 overflow-hidden">
			<Avatar
				avatarUrl={user.avatar ?? undefined}
				username={user.username}
				className="w-full h-full"
			/>
			</div>

			<div className="flex-1 text-center sm:text-left">
				<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
				<h2 className="text-2xl font-semibold text-silver-100">
					{user.username}
				</h2>

				{user.is_admin && (
					<span className="mx-auto sm:mx-0 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
						{t('profile_page_admin')}
					</span>
				)}
				</div>

				<p className="mt-2 text-sm text-silver-400">
				{t("profile_page_count_creation", { date: new Date(user.created_at).toLocaleDateString('fr-BE') })}
				</p>
			</div>
			</div>
		</div>

		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<div className="gold-edge-hover bg-surface-raised border border-surface-border rounded-xl p-5">
			<div className="mb-3 flex h-10 items-center">
				<img
				src="/assets/icons/diamond.svg"
				alt=""
				className="w-6 h-6 opacity-90"
				/>
			</div>
			<p className="text-3xl font-bold text-silver-100">
				{user.diamonds}
			</p>
			<p className="mt-1 text-sm text-silver-400">
				{t('profile_page_diamond')}
			</p>
			</div>

			<div className="gold-edge-hover bg-surface-raised border border-surface-border rounded-xl p-5">
			<div className="mb-3 flex h-10 items-center">
				<img
				src="/assets/icons/tower.svg"
				alt=""
				className="w-6 h-6 opacity-90"
				/>
			</div>
			<p className="text-3xl font-bold text-silver-100">
				{user.tower_progress}
			</p>
			<p className="mt-1 text-sm text-silver-400">
				{t('profile_page_tower_progress')}
			</p>
			</div>

			<div className="gold-edge-hover bg-surface-raised border border-surface-border rounded-xl p-5">
			<div className="mb-3 flex h-10 items-center">
				<img
				src="/assets/icons/map.svg"
				alt=""
				className="w-6 h-6 opacity-90"
				/>
			</div>
			<p className="text-3xl font-bold text-silver-100">
				{user.created_maps_count}
			</p>
			<p className="mt-1 text-sm text-silver-400">
				{t('profile_page_maps')}
			</p>
			</div>
		</div>

		<FriendsList />
		<ProfileEditor />
		</div>
	</Layout>
	);
}