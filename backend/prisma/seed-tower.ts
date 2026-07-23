
import { PrismaClient } from '@prisma/client';

const W = 1; // WALL
const E = 0; // EMPTY
const X = 2; // EXIT
const S = 3; // SPAWN

const SIZE = 25;

function border(grid: number[][]): number[][] {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (r === 0 || r === SIZE - 1 || c === 0 || c === SIZE - 1) {
        grid[r][c] = W;
      }
    }
  }
  return grid;
}

function emptyGrid(): number[][] {
  return Array.from({ length: SIZE }, () => new Array<number>(SIZE).fill(E));
}

// ─── Niveau 1 : couloir simple diagonal ──────────────────────────────────────
function level1(): number[][] {
  const g = emptyGrid();
  // Remplir l'intérieur de murs sauf un couloir horizontal
  for (let r = 1; r < SIZE - 1; r++) {
    for (let c = 1; c < SIZE - 1; c++) {
      g[r][c] = W;
    }
  }
  // Couloir horizontal au milieu (row 12)
  for (let c = 1; c < SIZE - 1; c++) g[12][c] = E;
  // Couloir vertical gauche
  for (let r = 1; r <= 12; r++) g[r][1] = E;
  // Couloir vertical droit
  for (let r = 12; r < SIZE - 1; r++) g[r][SIZE - 2] = E;

  g[1][1] = S;
  g[SIZE - 2][SIZE - 2] = X;
  return border(g);
}

// ─── Niveau 2 : zigzag simple ────────────────────────────────────────────────
function level2(): number[][] {
  const g = emptyGrid();
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) g[r][c] = W;

  // Couloir 1 : rangée 2 de col 1 à 18
  for (let c = 1; c <= 18; c++) g[2][c] = E;
  // Descente col 18 de row 2 à 12
  for (let r = 2; r <= 12; r++) g[r][18] = E;
  // Couloir 2 : rangée 12 de col 6 à 18
  for (let c = 6; c <= 18; c++) g[12][c] = E;
  // Descente col 6 de row 12 à 22
  for (let r = 12; r <= 22; r++) g[r][6] = E;
  // Couloir final : rangée 22 de col 6 à 23
  for (let c = 6; c <= 23; c++) g[22][c] = E;

  g[2][1] = S;
  g[22][SIZE - 2] = X;
  return border(g);
}

// ─── Niveau 3 : labyrinthe colonnes ──────────────────────────────────────────
function level3(): number[][] {
  const g = emptyGrid();
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) g[r][c] = E;

  // Murs verticaux alternés avec passages
  // Col 6 : mur de row 1 à 18
  for (let r = 1; r <= 18; r++) g[r][6] = W;
  // Col 12 : mur de row 6 à 23
  for (let r = 6; r <= 23; r++) g[r][12] = W;
  // Col 18 : mur de row 1 à 18
  for (let r = 1; r <= 18; r++) g[r][18] = W;

  g[1][1] = S;
  g[SIZE - 2][SIZE - 2] = X;
  return border(g);
}

// ─── Niveau 4 : labyrinthe lignes ────────────────────────────────────────────
function level4(): number[][] {
  const g = emptyGrid();
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) g[r][c] = E;

  // Murs horizontaux alternés
  for (let c = 1; c <= 20; c++) g[5][c] = W;
  for (let c = 4; c <= 23; c++) g[10][c] = W;
  for (let c = 1; c <= 20; c++) g[15][c] = W;
  for (let c = 4; c <= 23; c++) g[20][c] = W;

  g[1][1] = S;
  g[SIZE - 2][SIZE - 2] = X;
  return border(g);
}

// ─── Niveau 5 : labyrinthe en croix ──────────────────────────────────────────
function level5(): number[][] {
  const g = emptyGrid();
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) g[r][c] = E;

  // Grille de murs intérieurs (croix toutes les 6 cases)
  for (let r = 4; r <= 20; r += 4) {
    for (let c = 1; c < SIZE - 1; c++) {
      if (c % 6 !== 0) g[r][c] = W;
    }
  }
  for (let c = 6; c <= 18; c += 6) {
    for (let r = 1; r < SIZE - 1; r++) {
      if (r % 4 !== 0) g[r][c] = W;
    }
  }

  g[1][1] = S;
  g[SIZE - 2][SIZE - 2] = X;
  return border(g);
}

// ─── Niveau 6 : labyrinthe dense colonnes+lignes ─────────────────────────────
function level6(): number[][] {
  const g = emptyGrid();
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) g[r][c] = W;

  // Serpentin horizontal
  for (let r = 2; r < SIZE - 1; r += 4) {
    const leftToRight = (r / 4) % 2 === 0;
    const from = leftToRight ? 1 : 2;
    const to = leftToRight ? SIZE - 2 : SIZE - 1;
    for (let c = from; c < to; c++) g[r][c] = E;
  }
  // Connexions verticales alternées
  for (let r = 2; r < SIZE - 4; r += 4) {
    const leftToRight = (r / 4) % 2 === 0;
    const col = leftToRight ? SIZE - 2 : 1;
    g[r + 1][col] = E;
    g[r + 2][col] = E;
    g[r + 3][col] = E;
  }

  g[2][1] = S;
  g[SIZE - 3][SIZE - 2] = X;
  return border(g);
}

// ─── Niveau 7 : labyrinthe en U imbriqués ────────────────────────────────────
function level7(): number[][] {
  const g = emptyGrid();
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) g[r][c] = E;

  // U imbriqués ouverts en alternance bas/haut
  const walls = [
    // [row_start, row_end, col_start, col_end, opening_side, opening_col]
    [3, 3, 2, 20],
    [3, 10, 20, 20],
    [10, 10, 6, 20],
    [4, 10, 6, 6],
    [14, 14, 4, 22],
    [14, 21, 4, 4],
    [21, 21, 4, 18],
    [15, 21, 18, 18],
  ];

  for (const [r1, r2, c1, c2] of walls) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (r === r1 || r === r2 || c === c1 || c === c2) g[r][c] = W;
      }
    }
  }

  g[1][1] = S;
  g[SIZE - 2][SIZE - 2] = X;
  return border(g);
}

// ─── Niveau 8 : labyrinthe maximal ────────────────────────────────────────────
function level8(): number[][] {
  const g = emptyGrid();
  for (let r = 1; r < SIZE - 1; r++)
    for (let c = 1; c < SIZE - 1; c++) g[r][c] = W;

  // Couloir serpentin très serré
  for (let r = 1; r < SIZE - 1; r += 2) {
    if (r % 4 === 1) {
      for (let c = 1; c < SIZE - 1; c++) g[r][c] = E;
      if (r < SIZE - 2) g[r + 1][SIZE - 2] = E;
    } else {
      for (let c = 1; c < SIZE - 1; c++) g[r][c] = E;
      if (r < SIZE - 2) g[r + 1][1] = E;
    }
  }

  g[1][1] = S;
  // EXIT sur la dernière ligne libre
  const lastFreeRow = SIZE % 2 === 0 ? SIZE - 3 : SIZE - 2;
  g[lastFreeRow][SIZE - 2] = X;
  return border(g);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const LEVELS: Array<{ order_index: number; name: string; grid: number[][] }> = [
  { order_index: 1, name: 'Les Catacombes', grid: level1() },
  { order_index: 2, name: 'Le Couloir Brisé', grid: level2() },
  { order_index: 3, name: 'La Forêt de Colonnes', grid: level3() },
  { order_index: 4, name: 'Le Labyrinthe Plat', grid: level4() },
  { order_index: 5, name: 'La Croisée des Enfers', grid: level5() },
  { order_index: 6, name: 'Le Serpentin', grid: level6() },
  { order_index: 7, name: 'Les Pièges en U', grid: level7() },
  { order_index: 8, name: 'L\'Abîme Final', grid: level8() },
];

export async function seedTower(prisma: PrismaClient): Promise<void> {
  for (const level of LEVELS) {
    await prisma.adminMap.upsert({
      where: { order_index: level.order_index },
      update: {},
      create: {
        order_index: level.order_index,
        name: level.name,
        grid_json: JSON.stringify(level.grid),
      },
    });
    console.log(`✓ Niveau ${level.order_index} — ${level.name}`);
  }
}

// Exécution standalone : npx ts-node prisma/seed-tower.ts
if (require.main === module) {
  const prisma = new PrismaClient();
  seedTower(prisma)
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
