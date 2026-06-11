/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   user.types.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jdebrull <jdebrull@students.s42.be>        +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/05/15 00:00:00 by aulis             #+#    #+#             */
/*   Updated: 2026/06/11 15:16:59 by jdebrull         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export interface UserPublic {
  id: string;
  username: string;
  avatar: string | null;
  diamonds: number;
  tower_progress: number;
  created_maps_count: number;
  is_admin: boolean;
  created_at: string;
}

export interface UserProfile extends UserPublic {
  online_status: 'online' | 'offline' | 'in_game';
  friends_count: number;
}

export interface FriendPublic {
  id: string;
  username: string;
  avatar: string | null;
  online_status: 'online' | 'offline' | 'in-game';
  friendship_id: string;
  created_at: string;
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
}
