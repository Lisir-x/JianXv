"""Generate Windows and tray assets from icon.png, the raster export of icon.svg."""
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1] / 'assets'
with Image.open(root / 'icon.png') as source:
    image = source.convert('RGBA')
    image.resize((32, 32), Image.Resampling.LANCZOS).save(root / 'tray.png')
    sizes = [(size, size) for size in (16, 20, 24, 32, 40, 48, 64, 128, 256)]
    image.save(root / 'icon.ico', sizes=sizes)
