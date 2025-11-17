#!/usr/bin/env python3
"""
generate_responsive_images.py

Script para generar imágenes responsivas en múltiples resoluciones (900w, 600w, 300w)
Recorre recursivamente el árbol `img/` dentro del directorio base y, para cada imagen
encontrada, crea una carpeta de salida junto al archivo original con las versiones
WebP optimizadas únicamente si faltan (no re-genera versiones ya existentes).

Principales características
- Recorrido recursivo de img/ para encontrar todas las imágenes.
- Conversión segura a WebP (tratamiento de transparencia y EXIF).
- Generación únicamente de las versiones ausentes: `<name>-900w.webp`, `<name>-600w.webp`, `<name>-300w.webp`.
- Evita sobrescribir archivos existentes; no hay opción --force en esta versión.
- Mensajes informativos y manejo básico de errores para uso en CI (GitHub Actions).
"""

from pathlib import Path
import sys
import argparse
from PIL import Image, ImageOps, UnidentifiedImageError

# ---------------------------------------------------------------------
# Configuración de tamaños y extensiones
# ---------------------------------------------------------------------
SIZES = {
    '900w': {'width': 900, 'quality': 80},
    '600w': {'width': 600, 'quality': 75},
    '300w': {'width': 300, 'quality': 70}
}

# Extensiones de entrada admitidas (se usan para detectar imágenes).
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp'}


# ---------------------------------------------------------------------
# Utilidades de imagen
# ---------------------------------------------------------------------
def open_image_safe(path: Path) -> Image.Image:
    """
    Abre una imagen de forma segura aplicando la orientación EXIF si existe.

    Args:
        path: Ruta al archivo de imagen.

    Returns:
        Objeto PIL.Image abierto y con la orientación exif aplicada.

    Lanza:
        Exception con mensaje descriptivo si ocurre un error al abrir o si el
        formato no es reconocido.
    """
    try:
        img = Image.open(path)
        # Aplica orientación basada en EXIF (rotaciones automáticas)
        img = ImageOps.exif_transpose(img)
        return img
    except UnidentifiedImageError:
        raise Exception(f"Formato de imagen no reconocido: {path}")
    except Exception as e:
        raise Exception(f"Error abriendo imagen {path}: {e}")


def ensure_rgb_for_saving(img: Image.Image) -> Image.Image:
    """
    Asegura que la imagen esté en modo RGB listo para guardar en WebP.

    - Si la imagen tiene canal alfa (RGBA/LA) o paleta (P) crea un fondo blanco
      y aplasta la transparencia para obtener RGB.
    - Si la imagen ya es RGB la devuelve sin cambios.
    """
    if img.mode in ('RGBA', 'LA', 'P'):
        # Crear un fondo blanco del mismo tamaño
        background = Image.new('RGB', img.size, (255, 255, 255))
        # Si la imagen está en paleta, convertimos primero a RGBA para manejar la transparencia
        if img.mode == 'P':
            img = img.convert('RGBA')
        # Si tiene transparencia, pegamos sobre el fondo usando la máscara alfa
        if img.mode in ('RGBA', 'LA'):
            background.paste(img, mask=img.split()[-1])
            img = background
        else:
            img = img.convert('RGB')
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    return img


def convert_to_webp_if_needed(src_path: Path, output_dir: Path) -> Path:
    """
    Convierte la imagen fuente a WebP si no lo es y guarda la versión WebP en
    output_dir con nombre <stem>.webp.

    - Si la fuente ya es .webp, devuelve la ruta original (no la copia).
    - Crea output_dir si no existe.

    Args:
        src_path: Ruta a la imagen original.
        output_dir: Directorio donde guardar la conversión WebP.

    Returns:
        Path a la imagen WebP que deberá usarse para redimensionar versiones.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Si ya es webp no la convertimos ni copiamos: usaremos el archivo tal cual.
    if src_path.suffix.lower() == '.webp':
        return src_path

    webp_path = output_dir / f"{src_path.stem}.webp"

    # Si ya existe la conversión WebP en output_dir la usamos (no sobrescribimos)
    if webp_path.exists():
        return webp_path

    # Abrir, procesar y convertir
    with open_image_safe(src_path) as img:
        img = ensure_rgb_for_saving(img)
        # Guardar en WebP con calidad razonable y método de compresión
        img.save(webp_path, 'WEBP', quality=80, method=6)
    return webp_path


# ---------------------------------------------------------------------
# Lógica de procesamiento por imagen
# ---------------------------------------------------------------------
def process_image(src_path: Path):
    """
    Procesa una imagen individual:
    - Crea un directorio de salida junto a la imagen: <parent>/<stem>/
    - Convierte la imagen a WebP en ese directorio si no existe la conversión.
    - Genera únicamente las versiones WebP faltantes: <stem>-900w.webp, <stem>-600w.webp, <stem>-300w.webp.
    - Si las tres versiones ya existen se omite el procesamiento por completo.

    Args:
        src_path: Ruta a la imagen origen (archivo).
    """
    # Validaciones iniciales
    if not src_path.exists() or not src_path.is_file():
        print(f" Saltado (no existe o no es archivo): {src_path}")
        return

    # Directorio donde se dejarán las salidas (una carpeta por imagen)
    output_dir = src_path.parent / src_path.stem
    output_dir.mkdir(parents=True, exist_ok=True)

    # Rutas esperadas para las versiones responsivas
    expected_paths = {name: (output_dir / f"{src_path.stem}-{name}.webp") for name in SIZES.keys()}

    # Si ya existen todas las versiones, saltamos
    if all(p.exists() for p in expected_paths.values()):
        print(f" Omitido (todas las versiones existen): {src_path.relative_to(Path.cwd())}")
        return

    # Convertir la fuente a WebP si hace falta y usar esa imagen como base para redimensionar
    try:
        base_webp = convert_to_webp_if_needed(src_path, output_dir)
    except Exception as e:
        print(f" Error convirtiendo a WebP {src_path}: {e}")
        return

    # Abrimos la imagen base (puede ser la conversión recién creada o el webp original)
    try:
        with open_image_safe(base_webp) as img:
            img = ensure_rgb_for_saving(img)
            orig_w, orig_h = img.size
            # Evitar división por cero si archivo corrupto con ancho 0
            aspect = (orig_h / orig_w) if orig_w else 1

            # Generar sólo las versiones que faltan
            for size_name, cfg in SIZES.items():
                target_path = expected_paths[size_name]
                # Si existe, no re-generar
                if target_path.exists():
                    print(f"  Omitido (existe): {target_path.relative_to(Path.cwd())}")
                    continue

                target_w = cfg['width']
                quality = cfg['quality']

                # Mantener dimensiones si la imagen es más pequeña que el objetivo
                if orig_w <= target_w:
                    new_w, new_h = orig_w, orig_h
                else:
                    new_w = target_w
                    new_h = int(round(target_w * aspect))

                # Redimensionar con LANCZOS para buena calidad
                resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                # Guardar WebP (Pillow sobrescribe si ya existe, pero ya comprobamos existencia)
                try:
                    resized.save(target_path, 'WEBP', quality=quality, method=6)
                    print(f"  Generado: {target_path.relative_to(Path.cwd())} ({new_w}x{new_h}, {quality}%)")
                except Exception as e:
                    print(f"  Error guardando {target_path}: {e}")

    except Exception as e:
        print(f" Error procesando base WebP {base_webp}: {e}")


# ---------------------------------------------------------------------
# Recorrido de árbol y ejecución global
# ---------------------------------------------------------------------
def process_all_images(base_dir: Path):
    """
    Recorre recursivamente base_dir/img y procesa todas las imágenes encontradas.

    - Detecta archivos con extensiones definidas en IMAGE_EXTENSIONS.
    - Para cada archivo llama a process_image que sólo generará las versiones faltantes.
    - Imprime resúmenes para facilitar auditoría en logs de CI.
    """
    img_root = base_dir / 'img'
    if not img_root.exists() or not img_root.is_dir():
        print(f"No se encontró el directorio de imágenes: {img_root}")
        return

    # Buscar recursivamente todas las imágenes admitidas
    all_images = [p for p in img_root.rglob('*') if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS]

    if not all_images:
        print(f"No se encontraron imágenes en: {img_root}")
        return

    print(f"Iniciando procesamiento de {len(all_images)} imágenes en {img_root}\n")

    # Procesar una a una; en CI es preferible evitar paralelismo automático a menos que se controle I/O
    for img_path in all_images:
        # Mensaje por imagen (ruta relativa para logs más claros)
        try:
            rel = img_path.relative_to(base_dir)
        except Exception:
            rel = img_path
        print(f" Procesando: {rel}")
        process_image(img_path)

    print("\nProcesamiento finalizado.")


# ---------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------
def main():
    """
    Punto de entrada del script:
    - Acepta --dir para establecer directorio base (por defecto: directorio de trabajo).
    - Ejecuta el recorrido y procesamiento completo de img/.
    """
    parser = argparse.ArgumentParser(
        description='Genera versiones WebP responsivas (900w/600w/300w) para todas las imágenes en img/.'
    )
    parser.add_argument(
        '-d', '--dir',
        help='Directorio base del proyecto (por defecto: directorio actual)',
        default='.'
    )

    args = parser.parse_args()
    base = Path(args.dir).resolve()

    # Ejecutar procesamiento general; imprimir errores no fatales para que el job CI no falle por imágenes individuales
    process_all_images(base)


if __name__ == '__main__':
    # Salida controlada para uso en GitHub Actions: códigos de salida 0 en ejecución normal
    main()
