/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/* assets.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/* By: malafont <malafont@student.42belgium.be       +#+  +:+       +#+       */
/*                                                +#+#+#+#+#+   +#+           */
/* Created: 2026/05/21 00:00:00 by malafont        #+#    #+#               */
/* Updated: 2026/05/23 00:00:00 by malafont       ###   ########.fr          */
/*                                                                            */
/* ************************************************************************** */

// Paths are relative to Vite's public/ root — served as-is, no import needed.
// Keys are Phaser's internal texture cache identifiers.
// Both are consumed ONLY by GameScene.ts and BaseScene.ts.
// Never import these in EditorPage, EditorGrid, or TileSelector.

// ─── Clés internes Phaser (this.load.image / this.textures.exists) ────────────

export const KEY_TILE_FLOOR = 'tile_floor';
export const KEY_TILE_WALL = 'tile_wall';
export const KEY_TILE_EXIT = 'tile_exit';
export const KEY_TILE_SPAWN = 'tile_spawn';
export const KEY_TILE_WALL_SHEET = 'tile_wall_sheet';
export const KEY_SPRITE_PLAYER = 'sprite_player';
export const KEY_SPRITE_ENEMY_H = 'sprite_enemy_h';
export const KEY_SPRITE_ENEMY_V = 'sprite_enemy_v';

// ─── Chemins vers les fichiers dans public/ ───────────────────────────────────

export const ASSET_TILE_FLOOR = '/assets/tiles/floor.png';
export const ASSET_TILE_WALL = '/assets/tiles/wall.png';
export const ASSET_TILE_EXIT = '/assets/tiles/exit.png';
export const ASSET_TILE_SPAWN = '/assets/tiles/spawn.png';
export const ASSET_TILE_WALL_SHEET = '/assets/tiles/sprite tuile/titleSheet.png';//titleSheet.png

export const ASSET_SPRITE_PLAYER = '/assets/sprites/martinPlayer.png';
export const ASSET_SPRITE_PLAYER_JEN = '/assets/sprites/JenTopBiche.png';
export const ASSET_SPRITE_PLAYER_MAR = '/assets/sprites/martinPlayer.png';
export const ASSET_SPRITE_PLAYER_ELI = '/assets/sprites/elise.png';
export const ASSET_SPRITE_PLAYER_JER = '/assets/sprites/jerem.png';
export const ASSET_SPRITE_PLAYER_HERO = '/assets/sprites/hero_walking.png';
export const ASSET_SPRITE_ENEMY_H = '/assets/sprites/enemy_test.png'; //enemy_h enemy_v
export const ASSET_SPRITE_ENEMY_V = '/assets/sprites/enemy_test.png';

// Maps the avatar portrait URL (stored in user.avatar) to the in-game spritesheet.
export const AVATAR_TO_SPRITE: Record<string, string> = {
  '/assets/avatars/Martin_avatar2.png':    '/assets/sprites/martinPlayer.png',
  '/assets/avatars/Jerem_avatar.png':  '/assets/sprites/jerem.png',
  '/assets/avatars/Jen_avatar.png':     '/assets/sprites/JenTopBiche.png',
  '/assets/avatars/Elise_avatar.png': '/assets/sprites/elise.png',
};
export const DEFAULT_PLAYER_SPRITE = '/assets/sprites/martinPlayer.png';
