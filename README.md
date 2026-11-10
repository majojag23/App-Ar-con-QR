# Virtual eLearning · Experiencia AR (WebAR con QR)

Escaneas un QR, se abre la cámara del celular y, al apuntar a la **imagen ancla** impresa, aparece un panel 3D interactivo
(menú, íconos orbitando, demo con cursor, fuegos artificiales y botón de contacto). Funciona en **Safari (iOS)** y **Chrome (Android)**.

Stack: [MindAR](https://github.com/hiukim/mind-ar-js) (seguimiento de imagen) + [three.js](https://threejs.org). Todo está en `lib/` (sin CDN).

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | Página que abre el QR (interfaz + cámara) |
| `app.js` | Escena 3D, animación, toques, sonido |
| `draw.js` | Dibujo del panel, íconos, botón y cursor (canvas 2D) |
| `config.js` | **Textos, colores, enlace del botón y datos de ejemplo** |
| `imprimir.html` | Hoja imprimible con la imagen ancla + generador de QR |
| `assets/ancla.png` / `ancla.mind` | Imagen ancla y su versión compilada para el tracking |
| `tools/` | Scripts de desarrollo (servidor local, compilar ancla, pruebas) — no se publican |

## Publicar

Subir `index.html`, `app.js`, `draw.js`, `config.js`, `imprimir.html`, `assets/` y `lib/` a un hosting **con HTTPS** (la cámara lo exige).
Luego abrir `imprimir.html` en esa dirección, pegar la URL de `index.html`, generar el QR e imprimir.

## Desarrollo local

```bash
npm install --ignore-scripts
node tools/serve.mjs . 8099      # http://localhost:8099/index.html?debug=1
```

Si cambias la imagen ancla (`assets/ancla.png`), recompila el `.mind` con `node tools/compile.mjs` (con el servidor local activo).
