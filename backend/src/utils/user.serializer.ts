/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   user.serializer.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Jdebrull <jdebrull@student.s19.be>         +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/07/30 17:47:18 by Jdebrull          #+#    #+#             */
/*   Updated: 2026/08/03 22:18:25 by Jdebrull         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { User, UserAchievement } from '@prisma/client';
import { UserPublic } from '@ft/shared';
import { getLevelFromXp } from '../services/gamification.service';

type UserWithAchievements = User & {
  achievements?: UserAchievement[];
};

export function toUserPublic(user: UserWithAchievements): UserPublic {
  const xp = user.xp ?? 0;

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    xp,
    level: getLevelFromXp(xp),
    achievements: (user.achievements ?? []).map((achievement) => ({
      code: achievement.code as UserPublic['achievements'][number]['code'],
      unlocked_at: achievement.unlocked_at.toISOString(),
    })),
    diamonds: user.diamonds,
    tower_progress: user.tower_progress,
    created_maps_count: user.created_maps_count,
    is_admin: user.is_admin,
    created_at: user.created_at.toISOString(),
  };
}