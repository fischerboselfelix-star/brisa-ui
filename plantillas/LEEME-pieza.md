# Brisa UI · {CODIGO} {NOMBRE}

{DESCRIPCION}

Versión {VERSION} · Código abierto (licencia MIT) · Hecho en Dénia por Marina Code

## Qué hay en esta carpeta

| Archivo | Para qué |
|---|---|
| `{BASE}-elementor.json` | Plantilla para importar en **Elementor** (la pieza + una galería debajo) |
| `{BASE}-gutenberg.txt` | Bloques para pegar en el editor de **WordPress (Gutenberg)** |
| `{BASE}.html` | El código suelto, para cualquier web (Astro, HTML, Webflow…) |

Funciona con Elementor gratis y con el editor de bloques que trae WordPress. No hace falta instalar ningún plugin.

## Requisito

Tu usuario de WordPress tiene que ser **administrador**. Solo los administradores pueden guardar código `<script>`, y la pieza lo necesita.

## Opción A · Elementor

1. En el escritorio de WordPress: **Elementor → Plantillas → Plantillas guardadas** (en inglés: Elementor → Templates → Saved Templates).
2. Pulsa **Importar plantillas**, elige `{BASE}-elementor.json` y pulsa **Importar ahora**.
3. En tu página, con Elementor: icono de carpeta → **Mis plantillas** → **Insertar**.

¿Tu Elementor no abre la biblioteca? Arrastra un widget **HTML**, pega todo `{BASE}.html` en "Código HTML" y pon un widget **Basic Gallery** debajo.

## Opción B · Editor de bloques de WordPress (Gutenberg)

1. Abre `{BASE}-gutenberg.txt` con cualquier editor de texto, selecciona todo (**Cmd + A**) y cópialo (**Cmd + C**).
2. En tu página de WordPress, haz clic en un párrafo vacío y pega (**Cmd + V**). Aparecen dos bloques: **HTML personalizado** (la pieza) y **Galería** (vacía).

Si al pegar ves el código como texto en vez de bloques: menú **⋮** de arriba a la derecha → **Editor de código**, pega al final y vuelve con **Salir del editor de código**.

## Poner tus fotos (sin tocar código)

1. Haz clic en la galería que hay debajo de la pieza y añade tus fotos desde la Biblioteca de medios.
2. Guarda y abre la página publicada. La galería se oculta sola y la pieza usa tus fotos.

- No hace falta tocar el tamaño ni el enlace de la galería: la pieza usa siempre la foto original.
- El orden de la galería es el orden de las fotos. El texto alternativo de cada foto se usa como título en Abanico y Baraja.
- Cada pieza usa la galería que tiene justo debajo, así que puedes poner varias piezas en la misma página.
- Mientras no haya galería, la pieza enseña fotos de prueba de colores.

## Ajustes

Están en el `<div class="brisa …">` del código:

| Ajuste | Qué cambia | Ejemplo |
|---|---|---|
| `--b-ancho` | Ancho máximo | `520px`, `100%` |
| `--b-marco` | Color del marco | `#ffffff`, `transparent` |
| `--b-hueco` | Separación entre fotos | `8px` |
| `--b-radio` | Redondeo de las esquinas | `24px` |
| `data-proporcion` | Alto ÷ ancho | `1.3333` (3:4), `1` (cuadrado) |
| `data-pausa`, `data-cambio`, `data-velocidad` | Ritmo de la animación | segundos, píxeles o grados por segundo |
| `data-texto` | Solo Cascada: las palabras del fondo, separadas por `\|` | `Tu marca\|Tu ciudad` |
| `--b-texto` | Solo Cascada: color del texto del fondo | `#0b0b0b` |
| `data-fondo` | Solo Cascada y Rodillo: pone una foto de fondo. `primera` usa la primera de la galería | `primera` |
| `--b-fondo-velo` | Color que aclara u oscurece la foto de fondo | `rgba(0,0,0,.35)` |

## Si no se mueve

- **Plugins de caché** (WP Rocket, LiteSpeed, Autoptimize…) con "retrasar JavaScript": excluye el texto `brisa` de esa opción.
- Con **"reducir movimiento"** activado en el sistema, la pieza se queda quieta a propósito.

Más piezas y novedades en https://www.marinacode.dev/brisa/
