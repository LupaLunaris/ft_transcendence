/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   user.serializer.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Jdebrull <jdebrull@student.s19.be>         +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/07/30 17:47:18 by Jdebrull          #+#    #+#             */
/*   Updated: 2026/07/30 17:51:12 by Jdebrull         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { User } from '@prisma/client';
import { UserPublic } from '@ft/shared';

export function toUserPublic(user: User): UserPublic {
    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        diamonds: user.diamonds,
        tower_progress: user.tower_progress,
        created_maps_count: user.created_maps_count,
        is_admin: user.is_admin,
        created_at: user.created_at.toISOString(),
    };
}