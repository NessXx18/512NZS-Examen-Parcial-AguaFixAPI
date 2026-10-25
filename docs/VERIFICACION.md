# Verificación local de AguaFix II

Comprobaciones realizadas el 24 de octubre de 2026 (hora de Ciudad de México):

- Compilación NestJS correcta.
- 10 pruebas HTTP aprobadas en el equipo local y dentro de Docker con Node 22.
- Creación multipart, almacenamiento de URL y generación de correo con imagen, usando S3, repositorio y envío de correo simulados en las pruebas HTTP.
- Respuestas verificadas: 201 con foto, 400 sin foto/archivo inválido/DTO inválido, 413 por más de 5 MB y 502 al fallar S3.
- Registro/login del primer parcial verificados con hash de contraseña y respuestas sin contraseña.
- PostgreSQL 16 real en un contenedor temporal: migración inicial, inserción de datos anteriores, nueva migración, persistencia de ambas columnas, reejecución sin duplicar migraciones y reversión sin borrar reportes ni usuarios.
- Imagen de producción construida con `node:22-alpine`; comando final `node dist/main`, usuario `node` y migraciones JavaScript incluidas.
- Inspección de la imagen: no contiene `/app/.env`, `/app/compose.yaml` ni `/app/.git`.
- Compose validado con valores temporales mediante `docker compose config --no-env-resolution --quiet`.
- Archivos YAML, políticas JSON y scripts de Postman revisados sintácticamente.
- `git diff --check` correcto; `.env` ignorado y sin archivos `.env` versionados.
- Auditoría de dependencias: cero vulnerabilidades reportadas durante la instalación verificada.

Las pruebas locales no sustituyen las evidencias de entrega. Pendientes con tus cuentas reales: publicación del workflow en GitHub, imagen en Docker Hub, carga en tu bucket S3, recepción de correo SMTP y video. Sigue `ENTREGA.md`.
