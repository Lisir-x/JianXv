# Jianxu Serif

`NotoSerifSC.woff2` is the Noto Serif SC variable font from Google Fonts, converted to WOFF2 and limited to the 500–750 weight range. All original glyphs are retained so user-entered CJK text works offline. See `OFL-NotoSerifSC.txt` for the license.

To regenerate from the upstream `NotoSerifSC[wght].ttf` using FontTools and Brotli:

```python
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

font = TTFont("NotoSerifSC[wght].ttf")
font = instantiateVariableFont(font, {"wght": (500, 600, 750)})
font.flavor = "woff2"
font.save("NotoSerifSC.woff2")
```
