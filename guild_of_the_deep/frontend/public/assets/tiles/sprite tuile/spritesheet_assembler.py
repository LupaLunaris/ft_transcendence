#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════╗
║          SPRITESHEET ASSEMBLER  — by Claude          ║
║  Assemble des images PNG en une spritesheet prête    ║
║  à l'emploi pour Godot, Unity, RPG Maker, etc.       ║
╚══════════════════════════════════════════════════════╝

UTILISATION :
  python spritesheet_assembler.py [OPTIONS] <dossier_ou_fichiers>

EXEMPLES :
  # Assembler tous les PNG d'un dossier, 4 colonnes, tuiles 64x64
  python spritesheet_assembler.py --cols 4 --size 64 ./sprites/

  # Fichiers spécifiques, 8 colonnes, sortie personnalisée
  python spritesheet_assembler.py --cols 8 --out sheet.png walk_0.png walk_1.png walk_2.png

  # Padding entre les sprites, fond transparent
  python spritesheet_assembler.py --cols 4 --size 64 --padding 2 ./frames/

  # Plusieurs dossiers (1 animation = 1 dossier), triés
  python spritesheet_assembler.py --cols 4 --size 64 --sort ./idle/ ./walk/ ./attack/

OPTIONS :
  --cols        INT    Nombre de colonnes (défaut: auto = racine carrée)
  --rows        INT    Nombre de lignes (optionnel, découpe si trop d'images)
  --size        INT    Taille cible de chaque sprite en px (défaut: auto)
  --width       INT    Largeur cible du sprite (si différente de la hauteur)
  --height      INT    Hauteur cible du sprite (si différente de la largeur)
  --padding     INT    Espace entre les sprites en px (défaut: 0)
  --bg          STR    Couleur de fond : 'transparent', '#RRGGBB' (défaut: transparent)
  --out         STR    Fichier de sortie (défaut: spritesheet.png)
  --sort               Trier les fichiers par nom avant assemblage
  --preview            Afficher un aperçu après génération (si display dispo)
  --json               Générer un fichier JSON de métadonnées (coords de chaque frame)

  ── Suppression de fond ──────────────────────────────────────────────────
  --remove-bg          Active la suppression du fond (détection auto de la couleur
                       de coin : pixel haut-gauche utilisé comme couleur cible)
  --remove-color STR   Couleur à rendre transparente : 'auto', 'white', 'black',
                       ou '#RRGGBB'  (défaut si --remove-bg : auto)
  --tolerance   INT    Tolérance de couleur 0–255 (défaut: 30).
                       0 = correspondance exacte, 80+ = fond très dégradé
  --remove-corners     Utilise les 4 coins pour détecter la couleur de fond
                       (plus robuste sur les fonds non uniformes)

  --help               Afficher cette aide

EXEMPLES suppression de fond :
  # Fond blanc automatiquement supprimé
  python spritesheet_assembler.py --cols 4 --size 64 --remove-bg --remove-color white ./sprites/

  # Fond magenta (#FF00FF) avec tolérance large
  python spritesheet_assembler.py --cols 4 --size 64 --remove-bg --remove-color "#FF00FF" --tolerance 20 ./sprites/

  # Détection automatique par coin, tolérance 40
  python spritesheet_assembler.py --cols 4 --size 64 --remove-bg --tolerance 40 --remove-corners ./sprites/
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("❌ Pillow n'est pas installé. Lance : pip install pillow")
    sys.exit(1)


# ─────────────────────────────────────────────
#  COLLECTE DES IMAGES
# ─────────────────────────────────────────────

SUPPORTED = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp", ".tga"}


def collect_images(sources: list[str], sort: bool) -> list[Path]:
    """Collecte tous les fichiers image depuis des dossiers ou fichiers directs."""
    paths = []
    for src in sources:
        p = Path(src)
        if p.is_dir():
            found = [f for f in p.iterdir() if f.suffix.lower() in SUPPORTED]
            paths.extend(found)
        elif p.is_file() and p.suffix.lower() in SUPPORTED:
            paths.append(p)
        else:
            print(f"⚠️  Ignoré (non trouvé ou format non supporté) : {src}")

    if sort:
        paths.sort(key=lambda x: x.name)

    if not paths:
        print("❌ Aucune image trouvée. Vérifie les chemins et formats.")
        sys.exit(1)

    return paths


# ─────────────────────────────────────────────
#  DÉTECTION AUTOMATIQUE DE LA TAILLE
# ─────────────────────────────────────────────

def detect_sprite_size(paths: list[Path]) -> tuple[int, int]:
    """Détecte la taille cible en prenant le mode (taille la plus fréquente)."""
    sizes = {}
    for p in paths:
        try:
            img = Image.open(p)
            sizes[img.size] = sizes.get(img.size, 0) + 1
        except Exception:
            pass
    if not sizes:
        return (64, 64)
    return max(sizes, key=sizes.get)


# ─────────────────────────────────────────────
#  ASSEMBLAGE
# ─────────────────────────────────────────────

def parse_color(bg: str) -> tuple:
    """Convertit une couleur en tuple RGBA."""
    if bg.lower() == "transparent":
        return (0, 0, 0, 0)
    bg = bg.lstrip("#")
    if len(bg) == 6:
        r, g, b = int(bg[0:2], 16), int(bg[2:4], 16), int(bg[4:6], 16)
        return (r, g, b, 255)
    raise ValueError(f"Format couleur invalide : #{bg}. Utilise #RRGGBB ou 'transparent'.")


# ─────────────────────────────────────────────
#  SUPPRESSION DE FOND
# ─────────────────────────────────────────────

def parse_remove_color(value: str, img: Image.Image, use_corners: bool) -> tuple[int, int, int]:
    """Résout la couleur cible pour la suppression de fond."""
    v = value.strip().lower()

    if v == "white":
        return (255, 255, 255)
    if v == "black":
        return (0, 0, 0)

    if v == "auto":
        rgba = img.convert("RGBA")
        pixels = rgba.load()
        w, h = rgba.size
        corners = [pixels[0, 0], pixels[w - 1, 0], pixels[0, h - 1], pixels[w - 1, h - 1]]
        if use_corners:
            # Moyenne des 4 coins (ignore alpha)
            r = sum(c[0] for c in corners) // 4
            g = sum(c[1] for c in corners) // 4
            b = sum(c[2] for c in corners) // 4
        else:
            r, g, b = corners[0][0], corners[0][1], corners[0][2]
        return (r, g, b)

    # Couleur hexadécimale
    hex_val = value.lstrip("#")
    if len(hex_val) == 6:
        return (int(hex_val[0:2], 16), int(hex_val[2:4], 16), int(hex_val[4:6], 16))

    raise ValueError(f"Couleur invalide pour --remove-color : '{value}'")


def remove_background(img: Image.Image, target: tuple[int, int, int], tolerance: int) -> Image.Image:
    """
    Rend transparent tous les pixels dont la couleur est proche de `target`.
    Utilise une distance euclidienne dans l'espace RGB.
    Applique un floodfill depuis les 4 coins pour ne supprimer que le fond
    réel (et non les zones internes de même couleur).
    """
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    tr, tg, tb = target
    tol_sq = tolerance ** 2

    def is_close(px: tuple) -> bool:
        dr = int(px[0]) - tr
        dg = int(px[1]) - tg
        db = int(px[2]) - tb
        return (dr * dr + dg * dg + db * db) <= tol_sq * 3  # ×3 pour l'espace RGB normalisé

    # Floodfill BFS depuis les 4 coins
    visited = [[False] * h for _ in range(w)]
    queue = []

    for sx, sy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if is_close(pixels[sx, sy]) and not visited[sx][sy]:
            queue.append((sx, sy))
            visited[sx][sy] = True

    while queue:
        cx, cy = queue.pop()
        r, g, b, a = pixels[cx, cy]
        # Rendre transparent (conserver la valeur RGB pour les contours semi-transparents)
        pixels[cx, cy] = (r, g, b, 0)
        for nx, ny in [(cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)]:
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                if is_close(pixels[nx, ny]):
                    visited[nx][ny] = True
                    queue.append((nx, ny))

    return img


def assemble(
    image_paths: list[Path],
    cols: int,
    rows: int | None,
    sprite_w: int,
    sprite_h: int,
    padding: int,
    bg_color: tuple,
    out_path: str,
    generate_json: bool,
    remove_bg: bool = False,
    remove_color: str = "auto",
    tolerance: int = 30,
    remove_corners: bool = False,
) -> None:

    total = len(image_paths)
    if rows:
        cols = math.ceil(total / rows)
    else:
        rows = math.ceil(total / cols)

    cell_w = sprite_w + padding
    cell_h = sprite_h + padding
    sheet_w = cols * cell_w - padding   # pas de padding après la dernière colonne
    sheet_h = rows * cell_h - padding

    print(f"\n📐 Spritesheet : {cols} col × {rows} lignes = {total} sprites")
    print(f"   Taille sprite : {sprite_w}×{sprite_h}px | Padding : {padding}px")
    print(f"   Taille finale : {sheet_w}×{sheet_h}px")
    if remove_bg:
        label = remove_color if remove_color != "auto" else "auto (coin)"
        print(f"   🪄 Suppression de fond : couleur={label} | tolérance={tolerance}")

    sheet = Image.new("RGBA", (sheet_w, sheet_h), bg_color)

    metadata = {"sprite_width": sprite_w, "sprite_height": sprite_h,
                 "cols": cols, "rows": rows, "padding": padding, "frames": []}

    for idx, path in enumerate(image_paths):
        col = idx % cols
        row = idx // cols
        x = col * cell_w
        y = row * cell_h

        try:
            img = Image.open(path).convert("RGBA")

            # ── Suppression de fond ──────────────────────────
            if remove_bg:
                try:
                    target = parse_remove_color(remove_color, img, remove_corners)
                    img = remove_background(img, target, tolerance)
                except Exception as e:
                    print(f"   ⚠️  Suppression fond échouée pour {path.name} : {e}")

            if img.size != (sprite_w, sprite_h):
                img = img.resize((sprite_w, sprite_h), Image.NEAREST)
            sheet.paste(img, (x, y), img)
            print(f"   ✅ [{idx+1:3d}/{total}] {path.name} → ({x}, {y})")
        except Exception as e:
            print(f"   ❌ [{idx+1:3d}/{total}] {path.name} — Erreur : {e}")

        if generate_json:
            metadata["frames"].append({
                "index": idx,
                "name": path.stem,
                "file": path.name,
                "x": x, "y": y,
                "width": sprite_w, "height": sprite_h,
            })

    # Sauvegarde
    sheet.save(out_path)
    print(f"\n🎉 Spritesheet sauvegardée : {out_path}")

    if generate_json:
        json_path = Path(out_path).with_suffix(".json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        print(f"📄 Métadonnées JSON        : {json_path}")


# ─────────────────────────────────────────────
#  POINT D'ENTRÉE
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Assemble des sprites PNG en une spritesheet.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
        add_help=False,
    )
    parser.add_argument("sources", nargs="*", help="Dossiers ou fichiers image")
    parser.add_argument("--cols",    type=int,   default=None,            help="Nombre de colonnes")
    parser.add_argument("--rows",    type=int,   default=None,            help="Nombre de lignes")
    parser.add_argument("--size",    type=int,   default=None,            help="Taille uniforme du sprite (px)")
    parser.add_argument("--width",   type=int,   default=None,            help="Largeur du sprite (px)")
    parser.add_argument("--height",  type=int,   default=None,            help="Hauteur du sprite (px)")
    parser.add_argument("--padding", type=int,   default=0,               help="Espace entre sprites (px)")
    parser.add_argument("--bg",      type=str,   default="transparent",   help="Couleur de fond")
    parser.add_argument("--out",     type=str,   default="spritesheet.png", help="Fichier de sortie")
    parser.add_argument("--sort",           action="store_true",                  help="Trier par nom de fichier")
    parser.add_argument("--preview",        action="store_true",                  help="Afficher un aperçu")
    parser.add_argument("--json",           action="store_true",                  help="Générer un JSON de métadonnées")
    parser.add_argument("--remove-bg",      action="store_true",                  help="Supprimer le fond des images")
    parser.add_argument("--remove-color",   type=str,   default="auto",           help="Couleur à supprimer : auto, white, black, #RRGGBB")
    parser.add_argument("--tolerance",      type=int,   default=30,               help="Tolérance de couleur 0-255 (défaut: 30)")
    parser.add_argument("--remove-corners", action="store_true",                  help="Utiliser les 4 coins pour détecter la couleur de fond")
    parser.add_argument("--help",           action="store_true",                  help="Afficher l'aide")

    args = parser.parse_args()

    if args.help or not args.sources:
        print(__doc__)
        sys.exit(0)

    # Collecte
    paths = collect_images(args.sources, args.sort)
    print(f"\n🖼️  {len(paths)} image(s) trouvée(s)")

    # Taille des sprites
    if args.size:
        sw, sh = args.size, args.size
    elif args.width and args.height:
        sw, sh = args.width, args.height
    elif args.width or args.height:
        s = args.width or args.height
        sw, sh = s, s
    else:
        sw, sh = detect_sprite_size(paths)
        print(f"   Taille auto-détectée : {sw}×{sh}px")

    # Colonnes
    cols = args.cols or max(1, math.isqrt(len(paths)))

    # Couleur de fond
    try:
        bg = parse_color(args.bg)
    except ValueError as e:
        print(f"❌ {e}")
        sys.exit(1)

    # Assemblage
    assemble(
        image_paths=paths,
        cols=cols,
        rows=args.rows,
        sprite_w=sw,
        sprite_h=sh,
        padding=args.padding,
        bg_color=bg,
        out_path=args.out,
        generate_json=args.json,
        remove_bg=args.remove_bg,
        remove_color=args.remove_color,
        tolerance=args.tolerance,
        remove_corners=args.remove_corners,
    )

    # Aperçu
    if args.preview:
        try:
            Image.open(args.out).show()
        except Exception:
            print("⚠️  Aperçu non disponible dans cet environnement.")


if __name__ == "__main__":
    main()