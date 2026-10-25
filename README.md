# AguaFix II API

API NestJS para recibir reportes de fugas con foto, guardar la imagen en Amazon S3 y avisar a la cuadrilla por correo HTML. Continúa el repositorio del primer parcial.

**Guía completa de configuración, publicación y video:** [ENTREGA.md](ENTREGA.md).

## Inicio

1. Copia `.env.example` como `.env` y completa PostgreSQL, SMTP, AWS y tu usuario de Docker Hub.
2. Instala dependencias: `npm ci` (Node.js 22).
3. Ejecuta la migración: `npm run migration:run`.
4. Inicia en desarrollo: `npm run start:dev`.

`synchronize` permanece desactivado; la estructura se administra mediante migraciones.

## Seguridad

- `.env` y cualquier variante local se excluyen de Git; usa únicamente `.env.example` como plantilla.
- La API aplica encabezados de seguridad con Helmet y un límite global de 60 solicitudes por minuto por IP.
- `POST /auth/login` está limitado a 5 intentos por minuto por IP.
- CORS permanece desactivado salvo que se defina `CORS_ORIGIN` (admite varios orígenes separados por comas).

## Endpoints

- `POST /auth/register`: `{ "name", "email", "password", "isNotificationEnabled?" }`
- `POST /auth/login`: `{ "email", "password" }`
- `POST /reports`: `multipart/form-data` con `address`, `description`, `severity` (`low|medium|high`), `reporterPhone` y archivo obligatorio `photo` (JPEG, PNG o WebP, hasta 5 MB).
- `GET /reports`: incluye `photoUrl` y `repairPhotoUrl`.

Al crear un reporte se sube la foto a `reports/` en S3, se guarda su URL en PostgreSQL y después se envía el correo HTML con una etiqueta `<img>` a `MAINTENANCE_EMAIL`. Si falta la foto se responde 400; si supera 5 MB, 413; si S3 falla, 502.

## Migraciones y compatibilidad

La migración inicial se conserva. `1792800000000-AddReportPhotos.ts` agrega ambas columnas sin borrar datos. Las fotos de reportes anteriores y `repairPhotoUrl` pueden ser `null`. Los nuevos reportes siempre reciben `photoUrl`. No se ha solicitado un endpoint de reparación.

El DataSource descubre migraciones TypeScript en desarrollo y JavaScript compiladas en producción. `npm run migration:run:prod` usa `dist/database/data-source.js`.

## Docker y publicación

El Dockerfile usa dos etapas con `node:22-alpine`, instala solo dependencias de producción en la imagen final y ejecuta `node dist/main` como usuario `node`. Solo copia los archivos necesarios; `.env` y `compose.yaml` se excluyen también mediante `.dockerignore`.

El workflow publica `DOCKER_USER/aguafix-api:latest` en cada push a `main`, después de pasar las pruebas. Configura los Secrets `DOCKER_USER` y `DOCKER_PASSWORD` en GitHub. No requiere credenciales AWS ni SMTP para construir.

Con `.env` completo y la imagen publicada:

```powershell
docker compose pull
docker compose up -d
docker compose logs --tail 100 api
```

Compose usa la imagen publicada, levanta PostgreSQL 16 con almacenamiento persistente, espera su healthcheck y aplica las migraciones antes de iniciar la API.

## Verificación

```powershell
npm test
npm run test:postgres
```

`npm test` compila y ejecuta pruebas HTTP de multipart, foto obligatoria, formatos, tamaño, DTO, fallo de S3, plantilla de correo y registro/login. Usa servicios externos simulados, sin credenciales reales.

`npm run test:postgres` requiere Docker activo: crea un PostgreSQL temporal con contraseña aleatoria, comprueba las migraciones y la persistencia de las URLs, conserva registros anteriores, verifica la reversión y elimina su contenedor al terminar. No se conecta a tu base existente.

Para el video usa **Bruno** siguiendo `GUIA_VIDEO.md`: crea el POST a `/reports`, selecciona **Body → Multipart Form** y adjunta la imagen en `photo` mediante el icono de carga de la columna **Value**. También puedes importar `postman/AguaFix-II.postman_collection.json` en Bruno desde **+ → Import Collection**, con formato **Postman Collection**. Para registro/login establece las variables `testEmail` y `testPassword` (mínimo 6 caracteres).

La caché `.npm-cache` heredada del repositorio original deja de estar versionada. `.env` nunca debe agregarse a Git ni a la imagen.
