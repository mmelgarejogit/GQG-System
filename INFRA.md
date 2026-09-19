# Infraestructura — GQG System

Stack: **MariaDB 11** (con el trigger) + **Adminer** + **Next.js** (app).

## Puesta en marcha de UN comando (server)

```bash
./setup.sh
```

Ese script:

1. Genera credenciales aleatorias la **primera** vez y las escribe en `.env`
   (DB root/usuario, `ADMIN_PASSWORD`, `AUTH_SECRET`). Imprime el login del admin.
2. Levanta todo el Docker (MariaDB + Adminer + app) con el override de prod.
3. Recarga nginx para publicar `https://gqg.ianmrc.dev`.

> Re-ejecutarlo NO regenera las contrasenas (reusa el `.env` para no romper la BD).

## En las maquinas del equipo (sin nginx/net-app)

```bash
cp .env.example .env       # ajustar credenciales si quieren
docker compose --profile up -d            # solo base de datos + adminer
# o, con la app:
docker compose --profile app up
```

(No usar `docker-compose.prod.yml`: la red `net-app` solo existe en el server.)

- App: http://localhost:3000 · Login: `admin` / (ADMIN_PASSWORD del `.env`)
- Adminer (BD): http://localhost:8081 (MySQL · servidor `db` · usuario/clave del `.env`)
- BD desde la maquina (DBeaver): host `127.0.0.1`, puerto `3307`.

## Publicacion (nginx + Cloudflare)

- Subdominio: **`gqg.ianmrc.dev`** → `gqg-app:3000` (vhost en `/opt/nginx/conf.d/gqg/`).
- En Cloudflare: agregar `CNAME gqg → ianmrc.dev` (proxied / nube naranja), igual
  que los demas subdominios.

## Reiniciar la BD desde cero

```bash
docker compose down -v        # borra el volumen de datos
./setup.sh                    # vuelve a cargar db/*.sql (schema + trigger + pruebas)
```

## Estructura `db/`

| Archivo            | Que hace                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01_schema.sql`    | Tablas + datos base (catalogos, cliente, plazos 30/45/60, productos).                                                                                          |
| `02_trigger.sql`   | `ins_ventas` AFTER INSERT: genera las cuotas (contado/regular/irregular, redondeo).                                                                            |
| `03_pruebas.sql`   | 3 ventas de ejemplo + queries de verificacion/cuadre.                                                                                                          |
| `04_evolucion.sql` | Timbrado en EMPRESAS, anulacion de ventas y cuotas, tabla AUDITORIA, baja logica de plazos y depositos. Idempotente: se puede correr sobre una base existente. |

## Calidad de codigo (husky + lint-staged)

Al `git commit` corre **lint-staged**: `eslint --fix` + `prettier --write` sobre los
archivos staged (TS/TSX/CSS/JSON/MD). Se activa solo con `npm install` (script
`prepare` -> `husky`). 100% Node, sin Python.
