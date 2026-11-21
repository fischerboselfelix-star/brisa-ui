"""Brisa UI · generador.
Lee el núcleo (core/) y las piezas (piezas.json) y genera, para cada pieza, todos los envoltorios en dist/:
  elementor/  plantilla para importar (.json)
  gutenberg/  bloques para pegar en el editor de WordPress (.txt)
  html/       código suelto para cualquier web (widget HTML, Astro, HTML…)
Uso:  python3 build.py
"""
import base64, json, os, re, shutil, zipfile

RAIZ = os.path.dirname(os.path.abspath(__file__))
def ruta(*p): return os.path.join(RAIZ, *p)

VERSION = json.load(open(ruta('piezas.json')))['version']
PIEZAS = json.load(open(ruta('piezas.json')))['piezas']
JS = open(ruta('core', 'brisa.js'), encoding='utf-8').read()
CSS = re.sub(r'\n\s*', '\n', open(ruta('core', 'brisa.css'), encoding='utf-8').read()).strip()
FOTOS = json.load(open(ruta('core', 'fotos-prueba.json')))
# Fuentes incrustadas (solo las piezas que las piden, p. ej. Cascada)
FUENTES = {'anton': '\n' + open(ruta('core', 'fuentes', 'anton.css'), encoding='utf-8').read()}

# El código va codificado en un atributo del <div>: así no lo estropean los filtros de texto de WordPress
# ni la forma en que el editor de Elementor vuelve a ejecutar los <script>.
PAYLOAD = base64.b64encode(JS.encode('utf-8')).decode()
G = 'brisaV' + VERSION.replace('.', '_')
LOADER = ('<script>if(!window.' + G + '){window.' + G + '=1;new Function(decodeURIComponent(escape(atob('
          'document.getElementsByClassName(/brisa/.source)[0].dataset.brisajs))))()}</script>')
assert not re.search(r"['\"]|&&|--", LOADER[8:-9]), 'el cargador no puede llevar comillas, && ni --'


def codigo(p):
    """HTML completo de una pieza: comentario, <div> con fotos de prueba, estilos y cargador."""
    attrs = ' '.join(f'{k}="{v}"' for k, v in p.get('atributos', {}).items())
    imgs = ''.join(f'<img src="{s}" alt="Foto {i + 1}">' for i, s in enumerate(FOTOS))
    return (f'<!-- Brisa UI · {p["codigo"]} {p["nombre"]} · v{VERSION} · Licencia MIT · Fotos: añade una galería debajo -->\n'
            f'<div class="brisa brisa-{p["clave"]}" data-brisa="{p["clave"]}" {attrs} data-brisajs="{PAYLOAD}" '
            f'style="--b-ancho:{p["ancho"]}; --b-marco:{p.get("marco", "#ffffff")}; --b-hueco:8px; --b-radio:24px; aspect-ratio:{p["aspecto"]};">'
            f'{imgs}</div>\n<style>{CSS}{FUENTES.get(p.get("fuente"), "")}</style>\n{LOADER}\n')


def elementor(p, html):
    def sec(i, k, settings, tipo):
        return {"id": f"b{i}{k}s", "elType": "section", "isInner": False, "settings": {},
                "elements": [{"id": f"b{i}{k}c", "elType": "column", "isInner": False, "settings": {"_column_size": 100},
                              "elements": [{"id": f"b{i}{k}w", "elType": "widget", "widgetType": tipo, "isInner": False,
                                            "settings": settings, "elements": []}]}]}
    n = p['codigo'][-3:]
    galeria = {"wp_gallery": [], "thumbnail_size": "full", "gallery_link": "file", "open_lightbox": "no"}
    return {"content": [sec(n, 'h', {"html": html}, 'html'), sec(n, 'g', galeria, 'image-gallery')],
            "page_settings": [], "version": "0.4", "title": f'Brisa UI · {p["codigo"]} {p["nombre"]} v{VERSION}', "type": "section"}


def gutenberg(html):
    """Bloque «HTML personalizado» con la pieza + bloque «Galería» vacío debajo, listo para pegar en el editor."""
    return ('<!-- wp:html -->\n' + html.strip() + '\n<!-- /wp:html -->\n\n'
            '<!-- wp:gallery {"linkTo":"none","sizeSlug":"full"} -->\n'
            '<figure class="wp-block-gallery has-nested-images columns-default is-cropped"></figure>\n'
            '<!-- /wp:gallery -->\n')


GUIA = open(ruta('plantillas', 'LEEME-pieza.md'), encoding='utf-8').read()

if os.path.isdir(ruta('dist')):
    shutil.rmtree(ruta('dist'))
for p in PIEZAS:
    base = f'brisa-{p["codigo"].lower()}-{p["clave"]}'
    d = ruta('dist', base)
    os.makedirs(d)
    html = codigo(p)
    open(os.path.join(d, f'{base}.html'), 'w', encoding='utf-8').write(html)
    json.dump(elementor(p, html), open(os.path.join(d, f'{base}-elementor.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(os.path.join(d, f'{base}-gutenberg.txt'), 'w', encoding='utf-8').write(gutenberg(html))
    guia = (GUIA.replace('{CODIGO}', p['codigo']).replace('{NOMBRE}', p['nombre'])
                .replace('{DESCRIPCION}', p['descripcion']).replace('{BASE}', base).replace('{VERSION}', VERSION))
    open(os.path.join(d, 'LEEME.md'), 'w', encoding='utf-8').write(guia)
    with zipfile.ZipFile(ruta('dist', f'{base}-v{VERSION}.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(d)):
            z.write(os.path.join(d, f), f'{base}/{f}')
        z.write(ruta('LICENSE'), f'{base}/LICENSE')
        if p.get('fuente') == 'anton':
            z.write(ruta('core', 'fuentes', 'Anton-OFL.txt'), f'{base}/Anton-OFL.txt')

print(f'Brisa UI v{VERSION}: {len(PIEZAS)} piezas generadas en dist/')
