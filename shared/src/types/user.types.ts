/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* user.types.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be                 +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis           #+#    #+#               */
/* Updated: 2026/05/15 00:00:00 by jpaulis         ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

export interface UserPublic {
  id: string;
  username: string;
  avatar: string | null;
  diamonds: number;
  tower_progress: number;
  created_maps_count: number;
  created_at: string;
}

export interface UserProfile extends UserPublic {
  online_status: 'online' | 'offline' | 'in_game';
}

export interface UpdateProfileRequest {
  username?: string;
  avatar?: string;
}
