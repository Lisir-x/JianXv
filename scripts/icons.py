from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1] / 'assets'
root.mkdir(exist_ok=True)
image = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((8, 8, 248, 248), radius=64, fill='#237461')
draw.line([(68, 131), (109, 174), (190, 79)], fill='white', width=20, joint='curve')
image.save(root / 'icon.png')
image.resize((32, 32), Image.Resampling.LANCZOS).save(root / 'tray.png')
image.save(root / 'icon.ico', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
