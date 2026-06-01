/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* tiles.types.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: jpaulis <jpaulis@student.42be                 +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/15 00:00:00 by jpaulis           #+#    #+#               */
/* Updated: 2026/05/21 00:00:00 by jpaulis         ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

export const TILE = { EMPTY: 0, WALL: 1, EXIT: 2, SPAWN: 3, ENEMY_H: 4, ENEMY_V: 5 } as const;
export type TileValue = typeof TILE[keyof typeof TILE];
export const GRID_SIZE = 25;
export type Grid = TileValue[][];
