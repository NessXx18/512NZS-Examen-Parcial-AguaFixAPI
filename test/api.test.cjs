const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');

// Configuración aislada: no lee .env ni utiliza credenciales reales.
require.cache[require.resolve('../dist/config/envs')] = {
  exports: { envs: {
    storage: { region: 'us-east-1', bucket: 'aguafix-test' },
    mail: { maintenanceEmail: 'crew@example.invalid' },
  } },
};

const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { ReportsController } = require('../dist/reports/reports.controller');
const { ReportsService } = require('../dist/reports/reports.service');
const { ReportsRepository } = require('../dist/reports/repositories/reports.repository');
const { EmailService } = require('../dist/common/email/email.service');
const { StorageService } = require('../dist/storage/storage.service');
const { AuthController } = require('../dist/auth/auth.controller');
const { AuthService } = require('../dist/auth/auth.service');
const { UsersService } = require('../dist/users/users.service');
const { UsersRepository } = require('../dist/users/repositories/users.repository');
const { generateReportTemplate } = require('../dist/reports/templates/report.template');

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1kAAAAASUVORK5CYII=', 'base64');
const dto = { address: 'Hidalgo 123', description: 'Fuga en banqueta', severity: 'high', reporterPhone: '4771234567' };
let app, baseUrl, storage;
let reports = [], users = [], uploads = [], emails = [], events = [];
let s3Failure = false;

before(async () => {
  const module = await Test.createTestingModule({
    controllers: [ReportsController, AuthController],
    providers: [ReportsService, StorageService, AuthService, UsersService,
      { provide: ReportsRepository, useValue: {
        async create(data, photoUrl) {
          events.push('database');
          const report = { ...data, id: reports.length + 1, photoUrl, repairPhotoUrl: null, isResolved: false };
          reports.push(report);
          return report;
        },
        async findAll() { return reports; },
      } },
      { provide: EmailService, useValue: {
        async sendEmail(to, subject, html) { events.push('email'); emails.push({ to, subject, html }); },
      } },
      { provide: UsersRepository, useValue: {
        async findByEmail(email) { return users.find(user => user.email === email) || null; },
        async create(data, password) {
          const user = { ...data, email: data.email.toLowerCase(), password, id: users.length + 1 };
          users.push(user);
          return user;
        },
      } },
    ],
  }).compile();
  storage = module.get(StorageService);
  storage.client.send = async command => {
    if (s3Failure) throw new Error('S3 unavailable');
    events.push('s3');
    uploads.push(command.input);
    return {};
  };
  app = module.createNestApplication({ logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(0, '127.0.0.1');
  baseUrl = await app.getUrl();
});

after(async () => { await app?.close(); });
beforeEach(() => {
  reports = []; users = []; uploads = []; emails = []; events = []; s3Failure = false;
});

function form({ photo = png, type = 'image/png', field = 'photo', data = dto } = {}) {
  const body = new FormData();
  for (const [key, value] of Object.entries(data)) body.set(key, value);
  if (photo !== null) body.set(field, new Blob([photo], { type }), 'fuga.png');
  return body;
}

test('POST multipart sube a reports/, guarda URL y envía correo con imagen, en ese orden', async () => {
  const response = await fetch(`${baseUrl}/reports`, { method: 'POST', body: form() });
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.match(result.photoUrl, /^https:\/\/aguafix-test\.s3\.us-east-1\.amazonaws\.com\/reports\/[\da-f-]+\.png$/);
  assert.equal(result.repairPhotoUrl, null);
  assert.equal(uploads[0].Bucket, 'aguafix-test');
  assert.match(uploads[0].Key, /^reports\//);
  assert.equal(uploads[0].ContentType, 'image/png');
  assert.deepEqual(uploads[0].Body, png);
  assert.deepEqual(events, ['s3', 'database', 'email']);
  assert.equal(emails[0].to, 'crew@example.invalid');
  assert.ok(emails[0].html.includes(`<img src="${result.photoUrl}"`));
  for (const value of Object.values(dto)) assert.ok(emails[0].html.includes(value));
});

test('GET incluye photoUrl y repairPhotoUrl, también en los reportes anteriores', async () => {
  reports.push({ ...dto, id: 1, photoUrl: null, repairPhotoUrl: null });
  await fetch(`${baseUrl}/reports`, { method: 'POST', body: form() });
  const response = await fetch(`${baseUrl}/reports`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.equal(body[0].photoUrl, null);
  assert.ok(body[1].photoUrl);
  assert.equal(body[1].repairPhotoUrl, null);
});

test('POST sin photo responde 400 y no genera efectos externos', async () => {
  const response = await fetch(`${baseUrl}/reports`, { method: 'POST', body: form({ photo: null }) });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /photo/);
  assert.deepEqual(events, []);
});

test('POST JSON sin archivo sigue rechazando la foto faltante', async () => {
  const response = await fetch(`${baseUrl}/reports`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(events, []);
});

test('rechaza foto vacía, contenido falso, MIME incorrecto y nombre de campo incorrecto', async () => {
  for (const options of [
    { photo: Buffer.alloc(0) },
    { photo: Buffer.from('<script>fake</script>') },
    { type: 'application/pdf' },
    { field: 'file' },
  ]) {
    const response = await fetch(`${baseUrl}/reports`, { method: 'POST', body: form(options) });
    assert.equal(response.status, 400);
  }
  assert.deepEqual(events, []);
});

test('rechaza fotos mayores a 5 MB antes de subirlas', async () => {
  const response = await fetch(`${baseUrl}/reports`, {
    method: 'POST', body: form({ photo: Buffer.alloc(5 * 1024 * 1024 + 1) }),
  });
  assert.equal(response.status, 413);
  assert.deepEqual(events, []);
});

test('campos inválidos no suben archivo ni crean reporte', async () => {
  const response = await fetch(`${baseUrl}/reports`, {
    method: 'POST', body: form({ data: { ...dto, severity: 'urgent' } }),
  });
  assert.equal(response.status, 400);
  assert.deepEqual(events, []);
});

test('un fallo de S3 devuelve 502 sin guardar ni enviar correo', async () => {
  s3Failure = true;
  const response = await fetch(`${baseUrl}/reports`, { method: 'POST', body: form() });
  assert.equal(response.status, 502);
  assert.deepEqual(events, []);
  assert.equal(reports.length, 0);
  assert.equal(emails.length, 0);
});

test('la plantilla escapa los campos de texto y el atributo src', () => {
  const html = generateReportTemplate({ ...dto, address: '<script>x</script>', description: '" & < >' }, 'https://example.invalid/a?x="&y=1');
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('src="https://example.invalid/a?x=&quot;&amp;y=1"'));
});

test('registro y login del primer parcial conservan hash y no exponen contraseña', async () => {
  const password = require('node:crypto').randomUUID();
  const account = { name: 'Ciudadano de prueba', email: 'citizen@example.invalid', password };
  let response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(account),
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).password, undefined);
  assert.notEqual(users[0].password, password);
  response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password }),
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).password, undefined);
  response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: account.email, password: require('node:crypto').randomUUID() }),
  });
  assert.equal(response.status, 400);
});
