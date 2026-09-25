// Logical size of the Phaser canvas, kept free of any Phaser import so React
// components (and jsdom tests) can read it.
//
// The DOM box is scaled by CSS afterwards (cf. ScaledGameFrame): these values
// decide HOW MUCH of the map is visible, not how big the game looks on screen.
// Shrinking the canvas is therefore how we zoom in — no camera setZoom(), which
// would fight the roundPixels startFollow() used by the scenes.

// Do NOT change TILE_SIZE: the sprite scales (SCALE_PLAYER in GameScene /
// DuelScene, and the enemies' setScale(0.2)) are absolute, not derived from it,
// so bumping it would shrink every character relative to the tiles.
export const TILE_SIZE = 36;

/** Touch layout: square viewport of VIEW_TILES x VIEW_TILES tiles. */
export const VIEW_TILES = 15;

// Must stay an INTEGER: Phaser only enables its per-quad pixel snapping when
// the camera zoom is a whole number (Camera.preRender → renderRoundPixels), and
// the scenes follow the player with roundPixels on. A fractional zoom would
// leave the tile quads on sub-pixel boundaries and make the map shimmer while
// the camera scrolls.
//
// It is what keeps the touch canvas sharp: a CSS-scaled canvas is composited
// from its backing store, never re-rasterised, so rendering the 15-tile view at
// 2x gives a 1080px buffer for a ~390px box (roughly 1 device pixel per canvas
// pixel at DPR 3) instead of a 540px buffer stretched over it.
export const TOUCH_CAMERA_ZOOM = 2;

/** Square Phaser canvas for touch devices, in backing-store pixels. */
export const TOUCH_GAME_SIZE = VIEW_TILES * TILE_SIZE * TOUCH_CAMERA_ZOOM; // 1080

// Desktop keeps its historical canvas and its 1:1 camera (~22 x 17 tiles).
export const DESKTOP_GAME_WIDTH = 800;
export const DESKTOP_GAME_HEIGHT = 600;
export const DESKTOP_CAMERA_ZOOM = 1;
