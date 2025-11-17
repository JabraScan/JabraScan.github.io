#!/usr/bin/env python3
"""
generate_responsive_images.py

- Procesa recursivamente img/
- Para img/avatar/ genera versiones cuadradas WebP: 256x256, 64x64, 32x32
- Para el resto genera WebP responsivos: 900w, 600w, 300w
- NO crea subcarpetas; guarda las versiones junto al archivo original:
    imagen-900w.webp, imagen-600w.webp, imagen-300w.webp
    avatar-256x256.webp, avatar-64x64.webp, avatar-32x32.webp
- No sobrescribe archivos existentes; solo crea las versiones faltantes.
- No hace upscaling; gestiona EXIF y aplana transparencia sobre fondo blanco.
"""
from pathlib import Path
import sys
from PIL import Image, ImageOps, UnidentifiedImageError

# Configuración
RESPONSIVE_SIZES = {
    '900w': {'width': 900, 'quality': 80},
    '600w': {'width': 600, 'quality': 75},
    '300w': {'width': 300, 'quality': 70}
}
AVATAR_SIZES = [256, 64, 32]
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp'}

def open_image_safe(path: Path) -> Image.Image:
    try:
        img = Image.open(path)
        return ImageOps.exif_transpose(img)
    except UnidentifiedImageError:
        raise Exception(f"Formato no reconocido: {path}")
    except Exception as e:
        raise Exception(f"Error abriendo {path}: {e}")

def ensure_rgb_for_saving(img: Image.Image, bg=(255,255,255)) -> Image.Image:
    if img.mode in ('RGBA', 'LA', 'P'):
        if img.mode == 'P':
            img = img.convert('RGBA')
        background = Image.new('RGB', img.size, bg)
        if 'A' in img.getbands():
            background.paste(img, mask=img.split()[-1])
        else:
            background.paste(img)
        return background
    if img.mode != 'RGB':
        return img.convert('RGB')
    return img

def center_crop_to_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    if w == h:
        return img
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))

def save_webp_if_missing(img: Image.Image, out_path: Path, quality: int):
    if out_path.exists():
        return False
    img.save(out_path, 'WEBP', quality=quality, method=6)
    return True

def process_avatar(src_path: Path):
    try:
        img = open_image_safe(src_path)
    except Exception as e:
        print(f"Skip avatar {src_path}: {e}")
        return

    img = center_crop_to_square(img)
    orig_w, _ = img.size

    for size in AVATAR_SIZES:
        out_name = f"{src_path.stem}-{size}x{size}.webp"
        out_path = src_path.parent / out_name  # guarda junto al original
        if out_path.exists():
            print(f"  Omitido (existe): {out_path}")
            continue

        if orig_w <= size:
            to_save = ensure_rgb_for_saving(img)
        else:
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            to_save = ensure_rgb_for_saving(resized)

        try:
            saved = save_webp_if_missing(to_save, out_path, quality=85)
            if saved:
                print(f"  Generado avatar: {out_path} ({size}x{size})")
        except Exception as e:
            print(f"  Error guardando avatar {out_path}: {e}")

def process_responsive_image(src_path: Path):
    try:
        img = open_image_safe(src_path)
    except Exception as e:
        print(f"Skip imagen {src_path}: {e}")
        return

    img = ensure_rgb_for_saving(img)
    orig_w, orig_h = img.size
    aspect = orig_h / orig_w if orig_w else 1

    for name, cfg in RESPONSIVE_SIZES.items():
        out_name = f"{src_path.stem}-{name}.webp"
        out_path = src_path.parent / out_name  # guarda junto al original
        if out_path.exists():
            print(f"  Omitido (existe): {out_path}")
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
            saved = save_webp_if_missing(resized, out_path, quality=quality)
            if saved:
                print(f"  Generado: {out_path} ({new_w}x{new_h}, {quality}%)")
        except Exception as e:
            print(f"  Error guardando {out_path}: {e}")

def should_ignore_path(p: Path) -> bool:
    parts = [part.lower() for part in p.parts]
    if '.git' in parts:
        return True
    if any(part.startswith('.') for part in parts):
        return True
    return False

def process_all(base_dir: Path):
    base = base_dir.resolve()
    img_root = base / 'img'
    if not img_root.exists() or not img_root.is_dir():
        print(f"No existe carpeta img/: {img_root}")
        return

    # Avatares (directamente en img/avatar/)
    avatar_dir = img_root / 'avatar'
    if avatar_dir.exists() and avatar_dir.is_dir():
        avatar_files = [p for p in avatar_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]
        if avatar_files:
            print(f"Procesando {len(avatar_files)} avatares en {avatar_dir}")
            for f in avatar_files:
                print(f" Procesando avatar: {f.name}")
                process_avatar(f)
            print("Avatares procesados.\n")

    # Luego todas las demás imágenes bajo img/ (recursivo), excluyendo img/avatar
    all_images = [p for p in img_root.rglob('*') if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]
    all_images = [p for p in all_images if 'avatar' not in [part.lower() for part in p.relative_to(img_root).parts]]
    all_images = [p for p in all_images if not should_ignore_path(p)]

    if not all_images:
        print("No hay imágenes generales para procesar.")
        return

    print(f"Iniciando procesamiento de {len(all_images)} imágenes generales bajo {img_root}")
    for img_path in all_images:
        print(f" Procesando: {img_path.relative_to(base)}")
        process_responsive_image(img_path)
    print("Procesamiento general finalizado.")

if __name__ == '__main__':
    base = Path('.') if len(sys.argv) == 1 else Path(sys.argv[1])
    process_all(base)
