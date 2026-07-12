type Props = {
  avatarUrl?: string;
  username: string;
  className?: string;
};

export function Avatar({ avatarUrl, username, className }: Props) {
  return (
    <img
      src={avatarUrl || "/assets/avatars/default-avatar.png"}
      alt={username}
      className={`object-cover rounded-full ${className || ""}`}
    />
  );
}