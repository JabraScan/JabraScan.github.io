#!/usr/bin/env python3
"""
generate_responsive_images.py

Procesa:
- Imágenes generales en img/ creando versiones WebP responsivas (900w, 600w, 300w)
  en subcarpetas por imagen: <stem>/<stem>-900w.webp etc.
- Avatares en img/avatar/ creando versiones cuadradas WebP (256x256, 64x64, 32x32)
  en la misma convención de subcarpeta por imagen: <stem>/<stem>-256x256.webp etc.

Reglas comunes:
- No sobrescribe archivos existentes; solo crea las versiones faltantes.
- No realiza upscaling: si la imagen es más pequeña que un target, usa su tamaño original.
- Manejo de EXIF (orientación) y transparencias (aplana sobre fondo blanco antes de guardar).
"""

from pathlib import Path
import sys
import argparse
import os
from PIL import Image, ImageOps, UnidentifiedImageError

# ---------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------
RESPONSIVE_SIZES = {
    '900w': {'width': 900, 'quality': 80},
    '600w': {'width': 600, 'quality': 75},
    '300w': {'width': 300, 'quality': 70}
}

AVATAR_SQUARE_SIZES = [256, 64, 32]  # Integrado: solo estos tamaños para avatares

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp'}


# ---------------------------------------------------------------------
# Utilidades de imagen
# ---------------------------------------------------------------------
def open_image_safe(path: Path) -> Image.Image:
    try:
        img = Image.open(path)
        return ImageOps.exif_transpose(img)
    except UnidentifiedImageError:
        raise Exception(f"Formato de imagen no reconocido: {path}")
    except Exception as e:
        raise Exception(f"Error abriendo imagen {path}: {e}")


def ensure_rgb_for_saving(img: Image.Image) -> Image.Image:
    """
    Aplana transparencia sobre fondo blanco y asegura modo RGB para guardar en WebP.
    """
    if img.mode in ('RGBA', 'LA', 'P'):
        if img.mode == 'P':
            img = img.convert('RGBA')
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode in ('RGBA', 'LA'):
            background.paste(img, mask=img.split()[-1])
        else:
            background.paste(img)
        return background
    if img.mode != 'RGB':
        return img.convert('RGB')
    return img


# ---------------------------------------------------------------------
# Conversión base a WebP (útil para imágenes no-webp)
# ---------------------------------------------------------------------
def convert_to_webp_if_needed(src_path: Path, output_dir: Path) -> Path:
    """
    Convierte la fuente a un .webp base en output_dir/<stem>.webp si la fuente no es ya webp.
    Devuelve la Path del webp a usar como base (sea la original si ya era webp).
    No sobrescribe conversiones ya existentes.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    if src_path.suffix.lower() == '.webp':
        return src_path

    webp_path = output_dir / f"{src_path.stem}.webp"
    if webp_path.exists():
        return webp_path

    with open_image_safe(src_path) as img:
        img = ensure_rgb_for_saving(img)
        img.save(webp_path, 'WEBP', quality=80, method=6)
    return webp_path


# ---------------------------------------------------------------------
# Procesamiento de imágenes responsivas (general)
# ---------------------------------------------------------------------
def process_image_responsive(src_path: Path):
    if not src_path.exists() or not src_path.is_file():
        return

    output_dir = src_path.parent / src_path.stem
    output_dir.mkdir(parents=True, exist_ok=True)

    expected_paths = {name: (output_dir / f"{src_path.stem}-{name}.webp") for name in RESPONSIVE_SIZES.keys()}

    if all(p.exists() for p in expected_paths.values()):
        print(f"Omitido (todas las versiones existen): {src_path.relative_to(Path.cwd())}")
        return

    try:
        base_webp = convert_to_webp_if_needed(src_path, output_dir)
    except Exception as e:
        print(f"Error convirtiendo a WebP {src_path}: {e}")
        return

    try:
        with open_image_safe(base_webp) as img:
            img = ensure_rgb_for_saving(img)
            orig_w, orig_h = img.size
            aspect = (orig_h / orig_w) if orig_w else 1

            for size_name, cfg in RESPONSIVE_SIZES.items():
                target_path = expected_paths[size_name]
                if target_path.exists():
                    print(f"  Omitido (existe): {target_path.relative_to(Path.cwd())}")
                    continue

                target_w = cfg['width']
                quality = cfg['quality']

                if orig_w <= target_w:
                    new_w, new_h = orig_w, orig_h
                else:
                    new_w = target_w
                    new_h = int(round(target_w * aspect))

                resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                try:
                    resized.save(target_path, 'WEBP', quality=quality, method=6)
                    print(f"  Generado: {target_path.relative_to(Path.cwd())} ({new_w}x{new_h}, {quality}%)")
                except Exception as e:
                    print(f"  Error guardando {target_path}: {e}")

    except Exception as e:
        print(f"Error procesando base WebP {base_webp}: {e}")


# ---------------------------------------------------------------------
# Procesamiento de avatares (cuadrados)
# ---------------------------------------------------------------------
def center_crop_to_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    if w == h:
        return img
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def process_avatar_file(src_path: Path):
    if not src_path.exists() or not src_path.is_file():
        return

    output_dir = src_path.parent / src_path.stem
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        img = open_image_safe(src_path)
    except Exception as e:
        print(f"Skip avatar {src_path}: {e}")
        return

    img = center_crop_to_square(img)
    orig_w, orig_h = img.size

    for size in AVATAR_SQUARE_SIZES:
        out_path = output_dir / f"{src_path.stem}-{size}x{size}.webp"
        if out_path.exists():
            print(f"  Omitido (existe): {out_path.relative_to(Path.cwd())}")
            continue

        # No upscaling: si la imagen original (tras recorte) es menor, usamos su tamaño
        if orig_w <= size:
            to_save = ensure_rgb_for_saving(img)
        else:
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            to_save = ensure_rgb_for_saving(resized)

        try:
            to_save.save(out_path, 'WEBP', quality=85, method=6)
            print(f"  Generado avatar: {out_path.relative_to(Path.cwd())} ({size}x{size})")
        except Exception as e:
            print(f"  Error guardando avatar {out_path}: {e}")


# ---------------------------------------------------------------------
# Recorrido y ejecución general
# ---------------------------------------------------------------------
def process_all_images(base_dir: Path):
    base_dir = base_dir.resolve()

    # 1) Primero procesar avatares en img/avatar
    avatar_dir = base_dir / 'img' / 'avatar'
    if avatar_dir.exists() and avatar_dir.is_dir():
        avatar_files = [p for p in avatar_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]
        if avatar_files:
            print(f"Procesando {len(avatar_files)} avatares en {avatar_dir}")
            for f in avatar_files:
                print(f" Procesando avatar: {f.name}")
                process_avatar_file(f)
            print("Procesamiento de avatares finalizado.\n")
    else:
        print(f"No existe carpeta de avatares: {avatar_dir} (se omite)\n")

    # 2) Luego procesar el resto de imágenes en img/ (excluyendo /img/avatar)
    img_root = base_dir / 'img'
    if not img_root.exists() or not img_root.is_dir():
        print(f"No se encontró el directorio de imágenes: {img_root}")
        return

    # Buscar recursivamente todas las imágenes, ignorando la carpeta avatar
    all_images = [p for p in img_root.rglob('*') if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS and 'img' + os.sep + 'avatar' not in str(p)]
    # Alternative safe check: ensure 'avatar' isn't a parent
    all_images = [p for p in all_images if 'avatar' not in [part.lower() for part in p.parts]]

    if not all_images:
        print(f"No se encontraron imágenes generales en: {img_root}")
        return

    print(f"Iniciando procesamiento de {len(all_images)} imágenes generales en {img_root}\n")
    for img_path in all_images:
        try:
            rel = img_path.relative_to(base_dir)
        except Exception:
            rel = img_path
        print(f" Procesando: {rel}")
        process_image_responsive(img_path)

    print("\nProcesamiento general finalizado.")


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description='Genera WebP responsivos para img/ y versiones cuadradas para img/avatar'
    )
    parser.add_argument('-d', '--dir', help='Directorio base del proyecto (por defecto: directorio actual)', default='.')
    args = parser.parse_args()
    base = Path(args.dir)
    process_all_images(base)


if __name__ == "__main__":
    main()
