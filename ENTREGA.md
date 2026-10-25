# AguaFix II: configuración y entrega

El código está preparado en esta carpeta a partir del repositorio del primer parcial, conservando su historial. Todavía debes crear Docker Hub y S3, configurar los secretos, publicar con un push y grabar el video. No hay credenciales reales en los archivos de ejemplo.

## 1. Crear Docker Hub

1. Regístrate en https://hub.docker.com/ y verifica tu correo.
2. Anota tu usuario exacto, en minúsculas.
3. Crea un repositorio **público** llamado `aguafix-api` bajo ese usuario.
4. En la configuración de tu cuenta, abre **Personal access tokens** y genera uno con permiso de lectura y escritura de repositorios. Copia el token; se muestra una sola vez.
5. La URL que entregarás será `https://hub.docker.com/r/TU_USUARIO/aguafix-api`. Sustituye `TU_USUARIO` por tu usuario real.

Referencia oficial: [tokens de Docker Hub](https://docs.docker.com/security/access-tokens/personal-access-tokens/).

## 2. Crear y configurar S3

Si todavía no tienes cuenta AWS, crea una desde https://aws.amazon.com/ o utiliza el acceso a AWS Academy/Learner Lab de tu institución. Después inicia sesión en la consola.

1. Entra en la consola de AWS y abre **S3 → Create bucket**.
2. Usa un bucket de propósito general con nombre único, sin puntos, por ejemplo `aguafix-fotos-tu-identificador`. El nombre es público; no es una credencial.
3. Escoge una región y anota su código, por ejemplo `us-east-1`.
4. Conserva **Object Ownership: Bucket owner enforced / ACLs disabled** y el cifrado predeterminado SSE-S3. El código no usa ACLs.
5. Para cumplir con la URL pública y la foto en el correo, en **Permissions → Block public access → Edit** desmarca los dos bloqueos relacionados con políticas públicas: **BlockPublicPolicy** y **RestrictPublicBuckets**. Puedes mantener activados los dos bloqueos relacionados con ACLs. La configuración a nivel de cuenta u organización tampoco debe impedir esta política.
6. Abre `docs/s3-public-read-policy.json`, sustituye `REEMPLAZAR_NOMBRE_BUCKET` por el nombre real y pega el JSON en **Permissions → Bucket policy**. Permite únicamente leer objetos de `reports/*` públicamente; no permite subirlos ni listar el bucket.
7. No necesitas crear manualmente la carpeta `reports/`: S3 la mostrará cuando se suba la primera foto.

La lectura pública se configura con la [política de bucket de S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html). No se usa una URL firmada que expire. Para el video usa una fotografía de prueba sin información privada.

### Credenciales para subir desde la API

1. En **IAM**, crea un usuario para la aplicación, sin acceso a la consola, o utiliza el rol que te haya proporcionado tu institución.
2. Crea una política usando `docs/iam-upload-policy.json`, reemplazando el nombre del bucket, y asígnala al usuario. Da permiso `s3:PutObject` solamente en `reports/*`.
3. Para ejecutar en tu computadora, genera una access key en **Security credentials → Create access key** y guarda el ID y el secreto solamente en tu `.env` local.
4. Si AWS Academy/Learner Lab te proporciona credenciales temporales, usa las del laboratorio, incluyendo `AWS_SESSION_TOKEN`; expiran y debes actualizarlas. Si tu laboratorio prohíbe políticas públicas, este requisito necesita un bucket/cuenta autorizados por tu profesor.

## 3. Crear el archivo local .env

Abre una terminal PowerShell dentro de esta carpeta:

```powershell
Copy-Item .env.example .env
```

Completa estos valores en `.env`:

| Variable | Valor que debes colocar |
| --- | --- |
| `DB_USERNAME` | Usuario que el contenedor de PostgreSQL creará |
| `DB_PASSWORD` | Contraseña que tú elijas para PostgreSQL |
| `DB_NAME` | `aguafix`, o el nombre de tu base existente |
| `DB_HOST` | `localhost` para desarrollo local; Compose lo cambia a `db` dentro de la API |
| `MAIL_USER`, `MAIL_FROM` | Cuenta de correo que enviará las notificaciones |
| `MAIL_PASSWORD` | Contraseña de aplicación de tu proveedor SMTP |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE` | Datos SMTP; el ejemplo usa Gmail, puerto 465 y `true` |
| `MAINTENANCE_EMAIL` | Correo donde recibirás la notificación de la cuadrilla |
| `AWS_REGION` | Código de la región del bucket |
| `AWS_S3_BUCKET` | Nombre real del bucket, sin URL ni `s3://` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Credenciales IAM para subir fotos |
| `AWS_SESSION_TOKEN` | Token solo si tus credenciales son temporales; en otro caso déjalo vacío |
| `DOCKER_USER` | Tu usuario real de Docker Hub |

Si usas Gmail, activa la verificación en dos pasos y genera una contraseña de aplicación; no uses la contraseña normal de tu cuenta. Mantén el `.env` fuera del video, Git y Docker. El token de Docker Hub se guarda en GitHub Secrets; la API no lo necesita.

## 4. Configurar GitHub Actions

Usa el mismo repositorio del primer parcial:

https://github.com/NessXx18/512NZS-Examen-Parcial-AguaFixAPI

1. Abre **Settings → Secrets and variables → Actions → New repository secret**.
2. Agrega `DOCKER_USER`: tu usuario exacto de Docker Hub, en minúsculas.
3. Agrega `DOCKER_PASSWORD`: el token con escritura generado en Docker Hub.
4. Si GitHub tiene Actions desactivado, actívalo en la pestaña **Actions**.

No pongas credenciales AWS, SMTP ni PostgreSQL en el workflow. La construcción y las pruebas no las necesitan: las pruebas usan servicios simulados. Las credenciales reales se entregan al contenedor únicamente cuando lo ejecutas con Compose.

## 5. Revisar y publicar en main

Desde **AguaFix II**, verifica primero:

```powershell
npm ci
npm test
git remote -v
git status --short
git check-ignore .env
git ls-files .env
```

`git check-ignore .env` debe mostrar `.env`. `git ls-files .env` no debe mostrar nada. `origin` debe apuntar al repositorio de GitHub anterior. La carpeta original del primer parcial se conserva; realiza estos comandos en AguaFix II.

Inicia la grabación antes del siguiente bloque: muestra un cambio de código visible (por ejemplo, modifica el título del correo en `src/reports/templates/report.template.ts`) y luego:

```powershell
git add .
git diff --cached --stat
git commit -m "feat: agregar fotos S3 y publicacion Docker de AguaFix"
git push origin main
```

El push ejecutará `.github/workflows/docker-publish.yml`: instala dependencias, compila, prueba, inicia sesión en Docker Hub y publica `TU_USUARIO/aguafix-api:latest`.

Si el push dice `non-fast-forward`, revisa los cambios remotos con `git fetch origin` y `git log --oneline --left-right main...origin/main`. Integra los cambios antes de volver a subir; no uses `--force`.

## 6. Levantar API y PostgreSQL desde la imagen publicada

Abre Docker Desktop y espera a que el motor esté listo. Cuando Actions termine en verde:

```powershell
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail 100 api
```

Compose descarga la imagen de Docker Hub, espera a PostgreSQL, ejecuta las migraciones compiladas y arranca `node dist/main`. No construye la imagen localmente. Entra a `http://localhost:3000/reports`; al inicio devuelve `[]`.

Después de otra publicación, actualiza la API con:

```powershell
docker compose pull api
docker compose up -d api
```

`docker compose down` detiene los servicios y conserva los datos. Evita `down -v` si quieres conservarlos. Compose crea una base nueva en su volumen; no traslada automáticamente los datos de la instalación local del primer parcial.

### Usar la base del primer parcial en desarrollo

Con PostgreSQL local activo, configura en `.env` sus mismos datos de conexión. El historial de migraciones debe contener la migración inicial del proyecto. Después:

```powershell
npm ci
npm run migration:run
npm run start:dev
```

La nueva migración agrega columnas sin borrar reportes ni usuarios; `synchronize` continúa en `false`. Los reportes anteriores conservan sus datos y tendrán `photoUrl: null` y `repairPhotoUrl: null`. Cada reporte nuevo exige foto y obtiene una URL. No se solicita un endpoint de foto de reparación; por ahora ese campo permanece en `null`.

## 7. Probar en Postman

Importa `postman/AguaFix-II.postman_collection.json`. Usa `baseUrl=http://localhost:3000` y selecciona tu fotografía en el campo `photo` antes de enviar.

Para crear manualmente la petición:

1. Selecciona **POST** a `http://localhost:3000/reports`.
2. En **Body**, selecciona **form-data**.
3. Agrega las siguientes filas:

| Key | Tipo | Ejemplo |
| --- | --- | --- |
| `address` | Text | Calle Hidalgo 123, Centro |
| `description` | Text | Fuga de agua en la banqueta |
| `severity` | Text | `high` (también acepta `medium` y `low`) |
| `reporterPhone` | Text | 4771234567 |
| `photo` | File | Selecciona una foto JPEG, PNG o WebP de hasta 5 MB |

4. No escribas manualmente el encabezado `Content-Type`; Postman agrega el `boundary` de multipart.
5. Envía. Debes recibir **201** con `photoUrl` pública y `repairPhotoUrl: null`.
6. Abre `photoUrl` en una ventana privada: debe mostrar la imagen sin iniciar sesión en AWS.
7. En S3, abre tu bucket y `reports/`: muestra el objeto recién creado.
8. Abre el correo de `MAINTENANCE_EMAIL`; debe mostrar dirección, descripción, severidad, teléfono y la foto. Si el cliente bloquea imágenes externas, habilita su visualización.
9. Envía **GET** a `/reports` y comprueba ambos campos de foto.
10. Prueba enviar sin `photo`: debe responder **400**. Una foto vacía, formato incorrecto o campos inválidos también se rechazan. Una carga mayor de 5 MB responde **413**.

Para confirmar el primer parcial, prueba también `POST /auth/register` y `POST /auth/login`; están incluidos en la colección. Establece las variables `testEmail` y `testPassword` (mínimo 6 caracteres) en Postman. El registro sigue usando contraseñas cifradas y la respuesta no muestra la contraseña.

## 8. Video: orden obligatorio

Graba la pantalla mostrando, en este orden y sin mostrar secretos:

1. **Código, commit y push a main:** el cambio visible y los comandos del paso 5.
2. **GitHub Actions:** la ejecución iniciada por ese push, primero en progreso y después en verde; abre el paso de publicar imagen.
3. **Docker Hub:** el repositorio `aguafix-api`, el tag `latest` y su fecha/hora de última publicación actualizada.
4. **API, S3 y correo:** ejecuta Compose con la imagen recién publicada; muestra el POST multipart en Postman con la foto y respuesta 201, el objeto en `reports/` de S3 y el correo recibido con la foto visible.

También puedes mostrar GET y la respuesta 400 al quitar la foto como evidencia adicional, después de completar el orden solicitado.

## 9. Qué entregar

1. **URL del repositorio:** `https://github.com/NessXx18/512NZS-Examen-Parcial-AguaFixAPI` después de subir estos cambios a `main`.
2. **URL de Docker Hub:** `https://hub.docker.com/r/TU_USUARIO/aguafix-api`, ya con `latest` publicada. No entregues el marcador `TU_USUARIO`.
3. **Video** con las cuatro evidencias en el orden anterior, como archivo o enlace accesible según tu plataforma escolar.

El repositorio debe contener el código, las dos migraciones, Dockerfile, `.dockerignore`, `compose.yaml`, workflow y `.env.example`. El `compose.yaml` se entrega en Git, pero se excluye de la imagen. Nunca entregues `.env`, contraseñas, access keys ni tokens.

## Problemas comunes

- **Docker no conecta:** abre Docker Desktop, activa el motor Linux/WSL2 y espera a que arranque.
- **Actions: login falla:** revisa los nombres exactos de ambos Secrets y que el token tenga escritura sobre `aguafix-api`.
- **Imagen no encontrada:** espera al workflow en verde, confirma que el repositorio Docker sea público y revisa `DOCKER_USER` en `.env`.
- **S3 devuelve 502 en POST:** comprueba la región, nombre del bucket, vigencia de las credenciales, token temporal y permiso `s3:PutObject`.
- **La foto devuelve 403:** revisa la política pública `reports/*` y los bloqueos de políticas públicas de bucket/cuenta.
- **Correo falla:** revisa SMTP y contraseña de aplicación. La API conserva el comportamiento del primer parcial: primero guarda el reporte y después envía el correo; si SMTP falla, el reporte puede quedar guardado aunque la respuesta sea de error. Revisa GET antes de repetirlo.
- **Cambiaste la contraseña de PostgreSQL:** cambiar `.env` no modifica un usuario dentro de un volumen ya inicializado; conserva la contraseña original o cámbiala dentro de PostgreSQL.
