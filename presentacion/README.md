# Presentación de defensa — GQG System

Deck HTML **estático y dinámico** que reemplaza al PPT. Recorre, en el mismo orden que
la guía de defensa, el problema, las tres modalidades, la **arquitectura**, el modelo de
datos (**DER** en SVG, fiel a `db/01_schema.sql`), el **trigger** `ins_ventas`, el flujo
de generación de cuotas, los ABMs, la pantalla de venta, las pruebas y el cierre.

## Cómo verla
- Abrir `index.html` en cualquier navegador (no necesita servidor ni build).
- O publicarla con **GitHub Pages** (Settings → Pages → carpeta `/presentacion`).

## Navegación
- `←` / `→` (o barra espaciadora) para avanzar y retroceder.
- `F` pantalla completa · `Home` / `End` primera / última · puntos inferiores para saltar.
- Swipe en pantallas táctiles.

Un solo archivo autocontenido (`index.html`): tipografías por CDN (Fraunces · Hanken
Grotesk · JetBrains Mono), todo lo demás inline. Paleta coherente con `DESIGN.md`.
