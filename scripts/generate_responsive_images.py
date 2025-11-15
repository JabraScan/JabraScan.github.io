#!/usr/bin/env python3
"""
Script para generar imágenes responsivas en múltiples resoluciones
Procesa imágenes y genera versiones WebP optimizadas en 900w, 600w y 300w
"""

import os
import sys
from pathlib import Path
from PIL import Image
import argparse


class ImageProcessor:
    """Procesa imágenes para generar versiones responsivas"""
    
    # Configuraciones según la tabla de especificaciones
    SIZES = {
        '900w': {'width': 900, 'quality': 80},
        '600w': {'width': 600, 'quality': 75},
        '300w': {'width': 300, 'quality': 70}
    }
    
    def __init__(self, base_dir=None):
        """
        Inicializa el procesador
        
        Args:
            base_dir: Directorio base del proyecto (por defecto el actual)
        """
        self.base_dir = Path(base_dir) if base_dir else Path.cwd()
        self.img_dir = self.base_dir / 'img'
        
    def process_image(self, image_path, output_dir=None):
        """
        Procesa una imagen y genera las versiones responsivas
        
        Args:
            image_path: Ruta a la imagen original
            output_dir: Directorio de salida (por defecto crea carpeta automática)
        
        Returns:
            dict: Rutas de las imágenes generadas
        """
        image_path = Path(image_path)
        
        if not image_path.exists():
            raise FileNotFoundError(f"No se encontró la imagen: {image_path}")
        
        # Crear directorio de salida si no existe
        if output_dir is None:
            # Crear carpeta con el nombre del archivo (sin extensión)
            output_dir = image_path.parent / image_path.stem
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Abrir imagen original
        try:
            with Image.open(image_path) as img:
                # Convertir a RGB si es necesario (para WebP)
                if img.mode in ('RGBA', 'P', 'LA'):
                    # Crear fondo blanco para transparencias
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    if img.mode in ('RGBA', 'LA'):
                        background.paste(img, mask=img.split()[-1])
                        img = background
                    else:
                        img = img.convert('RGB')
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                original_width, original_height = img.size
                aspect_ratio = original_height / original_width
                
                generated_files = {}
                
                # Generar cada tamaño
                for size_name, config in self.SIZES.items():
                    target_width = config['width']
                    quality = config['quality']
                    
                    # Solo redimensionar si la imagen original es más grande
                    if original_width <= target_width:
                        # Si la imagen es más pequeña, usar dimensiones originales
                        new_width = original_width
                        new_height = original_height
                    else:
                        new_width = target_width
                        new_height = int(target_width * aspect_ratio)
                    
                    # Redimensionar imagen
                    resized_img = img.resize(
                        (new_width, new_height),
                        Image.Resampling.LANCZOS
                    )
                    
                    # Guardar como WebP
                    output_filename = f"{image_path.stem}-{size_name}.webp"
                    output_path = output_dir / output_filename
                    
                    resized_img.save(
                        output_path,
                        'WebP',
                        quality=quality,
                        method=6  # Mejor compresión
                    )
                    
                    generated_files[size_name] = output_path
                    print(f"Generado: {output_path} ({new_width}x{new_height}, {quality}%)")
                
                return generated_files
                
        except Exception as e:
            raise Exception(f"Error procesando {image_path}: {str(e)}")
    
    def process_book_images(self, book_name):
        """
        Procesa todas las imágenes de un libro específico
        
        Args:
            book_name: Nombre del libro (carpeta)
        """
        book_img_dir = self.img_dir / book_name
        
        if not book_img_dir.exists():
            print(f"No se encontró el directorio: {book_img_dir}")
            return
        
        # Buscar todas las imágenes
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        images = [
            f for f in book_img_dir.iterdir()
            if f.is_file() and f.suffix.lower() in image_extensions
        ]
        
        if not images:
            print(f"No se encontraron imágenes en: {book_img_dir}")
            return
        
        print(f"\nProcesando libro: {book_name}")
        print(f" Directorio: {book_img_dir}")
        print(f" Imágenes encontradas: {len(images)}\n")
        
        for image_path in images:
            try:
                print(f"\nProcesando: {image_path.name}")
                self.process_image(image_path)
            except Exception as e:
                print(f"Error: {e}")
    
    def process_all_books(self):
        """Procesa todas las imágenes de todos los libros"""
        if not self.img_dir.exists():
            print(f"No se encontró el directorio de imágenes: {self.img_dir}")
            return
        
        # Obtener todos los subdirectorios (libros)
        book_dirs = [d for d in self.img_dir.iterdir() if d.is_dir()]
        
        if not book_dirs:
            print("No se encontraron carpetas de libros")
            return
        
        print(f"\nIniciando procesamiento de {len(book_dirs)} libros...\n")
        
        for book_dir in book_dirs:
            self.process_book_images(book_dir.name)
        
        print("\nProcesamiento completado!")


def main():
    """Función principal del script"""
    parser = argparse.ArgumentParser(
        description='Genera imágenes responsivas en múltiples resoluciones (900w, 600w, 300w)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos de uso:
  # Procesar una imagen específica
  python generate_responsive_images.py -i img/MiLibro/portada.jpg
  
  # Procesar todas las imágenes de un libro
  python generate_responsive_images.py -b MiLibro
  
  # Procesar todos los libros
  python generate_responsive_images.py -a
        """
    )
    
    parser.add_argument(
        '-i', '--image',
        help='Ruta a una imagen específica para procesar'
    )
    
    parser.add_argument(
        '-b', '--book',
        help='Nombre del libro (carpeta) para procesar todas sus imágenes'
    )
    
    parser.add_argument(
        '-a', '--all',
        action='store_true',
        help='Procesar todas las imágenes de todos los libros'
    )
    
    parser.add_argument(
        '-d', '--dir',
        help='Directorio base del proyecto (por defecto: directorio actual)'
    )
    
    args = parser.parse_args()
    
    # Validar que se proporcionó al menos una opción
    if not (args.image or args.book or args.all):
        parser.print_help()
        sys.exit(1)
    
    # Crear procesador
    processor = ImageProcessor(args.dir)
    
    try:
        if args.image:
            # Procesar imagen individual
            print(f"\n Procesando imagen individual...\n")
            processor.process_image(args.image)
            print("\nImagen procesada exitosamente!")
            
        elif args.book:
            # Procesar libro específico
            processor.process_book_images(args.book)
            print("\nLibro procesado exitosamente!")
            
        elif args.all:
            # Procesar todos los libros
            processor.process_all_books()
    
    except KeyboardInterrupt:
        print("\n\nProcesamiento cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
