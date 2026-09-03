# AguaFix API

API para recibir reportes ciudadanos de fugas de agua y avisar a la cuadrilla por correo.

## Inicio

1. Copia `.env.example` como `.env` y completa las credenciales de PostgreSQL y SMTP.
2. Instala dependencias: `npm install`.
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
- `POST /reports`: `{ "address", "description", "severity": "low|medium|high", "reporterPhone" }`
- `GET /reports`

Al crear un reporte se persiste primero y después se envía el correo HTML a `MAINTENANCE_EMAIL`.
