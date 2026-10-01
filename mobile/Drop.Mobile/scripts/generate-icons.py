import math, sys
# Renders the app icon, splash and Android adaptive icons from the DropLogo geometry.
# Usage: python3 scripts/generate-icons.py assets/images   (needs Pillow)
from PIL import Image, ImageDraw, ImageFilter

# Geometry in a 100x100 box — kept identical to src/ui/components/DropLogo.tsx.
def cubic(p0, p1, p2, p3, n=80):
    out = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        out.append((mt**3*p0[0] + 3*mt*mt*t*p1[0] + 3*mt*t*t*p2[0] + t**3*p3[0],
                    mt**3*p0[1] + 3*mt*mt*t*p1[1] + 3*mt*t*t*p2[1] + t**3*p3[1]))
    return out

def pin():
    pts = cubic((50, 93), (43, 81), (19, 66), (19, 42))
    # Arc over the top: from 180deg to 360deg (left -> top -> right), center (50,42) r 31.
    for i in range(1, 121):
        a = math.pi + math.pi * i / 120
        pts.append((50 + 31 * math.cos(a), 42 + 31 * math.sin(a)))
    pts += cubic((81, 42), (81, 66), (57, 81), (50, 93))[1:]
    return pts

BOLT = [(56, 19), (36, 47), (48, 47), (44, 66), (65, 37), (53, 37)]

def tx(points, scale, ox, oy):
    return [(ox + x * scale, oy + y * scale) for x, y in points]

def gradient(size, top, bottom):
    img = Image.new('RGBA', (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        for_t = y / (size - 1)
        # Diagonal feel: blend by y, the x shift comes from a second pass below.
        c = tuple(int(top[i] + (bottom[i] - top[i]) * for_t) for i in range(3)) + (255,)
        d.line([(0, y), (size, y)], fill=c)
    return img

def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

LIME = hexrgb('C8F53C'); TOP = hexrgb('8466FF'); BOTTOM = hexrgb('4B27E0'); NIGHT = hexrgb('120D24')

def mark(size, scale, ox, oy, fill, cut, background=None, glow=True, ground=True):
    S = 4  # supersample
    big = size * S
    base = background.resize((big, big)) if background else Image.new('RGBA', (big, big), (0, 0, 0, 0))
    if ground:
        sh = Image.new('RGBA', (big, big), (0, 0, 0, 0))
        g = ImageDraw.Draw(sh)
        cx, cy = (ox + 50 * scale) * S, (oy + 95 * scale) * S
        g.ellipse([cx - 17 * scale * S, cy - 3.2 * scale * S, cx + 17 * scale * S, cy + 3.2 * scale * S], fill=(14, 8, 40, 120))
        sh = sh.filter(ImageFilter.GaussianBlur(3 * scale * S))
        base = Image.alpha_composite(base, sh)
    if glow:
        gl = Image.new('RGBA', (big, big), (0, 0, 0, 0))
        ImageDraw.Draw(gl).polygon(tx(pin(), scale * S, ox * S, oy * S), fill=fill + (110,))
        gl = gl.filter(ImageFilter.GaussianBlur(9 * scale * S))
        base = Image.alpha_composite(base, gl)
    layer = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.polygon(tx(pin(), scale * S, ox * S, oy * S), fill=fill + (255,))
    bolt = tx(BOLT, scale * S, ox * S, oy * S)
    if cut is None:
        d.polygon(bolt, fill=(0, 0, 0, 0))
    out = Image.alpha_composite(base, layer)
    if cut is not None:
        ImageDraw.Draw(out).polygon(bolt, fill=cut + (255,))
    return out.resize((size, size), Image.LANCZOS)

out = sys.argv[1]
bg = gradient(1024, TOP, BOTTOM)
# Icon: lime pin, bolt in the deep brand purple.
mark(1024, 7.0, 512 - 350, 512 - 345, LIME, hexrgb('4B27E0'), background=bg, glow=False).convert('RGB').save(f'{out}/icon.png')
# Splash: the pin alone, bolt cut through to the dark splash background.
mark(1024, 6.4, 512 - 320, 512 - 346, LIME, None, glow=False, ground=False).save(f'{out}/splash-icon.png')
# Android adaptive: foreground inside the 66% safe zone over the gradient background.
mark(1024, 4.2, 512 - 210, 512 - 200, LIME, hexrgb('4B27E0'), glow=False, ground=False).save(f'{out}/android-icon-foreground.png')
gradient(1024, TOP, BOTTOM).convert('RGB').save(f'{out}/android-icon-background.png')
mark(1024, 4.2, 512 - 210, 512 - 200, (255, 255, 255), None, glow=False, ground=False).save(f'{out}/android-icon-monochrome.png')
mark(48, 0.44, 24 - 22, 24 - 21, LIME, hexrgb('4B27E0'), background=gradient(48, TOP, BOTTOM), glow=False, ground=False).save(f'{out}/favicon.png')
print('ok')
