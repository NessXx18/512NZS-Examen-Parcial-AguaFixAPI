// Prueba opcional con PostgreSQL real. Requiere Docker Desktop activo.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
require('reflect-metadata');

const name = `aguafix-check-${randomUUID()}`;
const password = randomUUID();
const docker = (...args) => execFileSync('docker', args, {
  encoding: 'utf8', env: { ...process.env, POSTGRES_PASSWORD: password },
  stdio: ['ignore', 'pipe', 'pipe'],
});

async function main() {
  let source;
  let created = false;
  try {
    docker('run', '--detach', '--rm', '--name', name, '--env', 'POSTGRES_PASSWORD', '--publish', '127.0.0.1::5432', 'postgres:16-alpine');
    created = true;
    const port = Number(docker('port', name, '5432/tcp').trim().split(':').pop());
    const config = { host: '127.0.0.1', port, user: 'postgres', password, database: 'postgres', connectionTimeoutMillis: 1000 };
    let ready = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      const client = new Client(config);
      try { await client.connect(); ready = true; }
      catch { await new Promise(resolve => setTimeout(resolve, 1000)); }
      finally { await client.end(); }
      if (ready) break;
    }
    assert.ok(ready, 'PostgreSQL no inició dentro del tiempo permitido');
    require.cache[require.resolve('../dist/config/envs')] = {
      exports: { envs: { database: { host: config.host, port, username: config.user, password, name: config.database } } },
    };
    source = require('../dist/database/data-source').default;
    const allMigrations = source.options.migrations;
    const { InitialSchema1725400000000 } = require('../dist/database/migrations/1725400000000-InitialSchema');
    source.setOptions({ migrations: [InitialSchema1725400000000] });
    await source.initialize();
    await source.runMigrations();
    await source.query('INSERT INTO "WATER_REPORT" ("address", "description", "severity", "reporterPhone") VALUES ($1, $2, $3, $4)', ['Reporte anterior', 'Conservar datos', 'low', '4771234567']);
    await source.query('INSERT INTO "SYSTEM_USER" ("name", "email", "password") VALUES ($1, $2, $3)', ['Usuario anterior', 'legacy@example.invalid', randomUUID()]);
    await source.destroy();

    // Usa la ruta de migraciones de producción, con archivos JS compilados.
    source.setOptions({ migrations: allMigrations });
    await source.initialize();
    const applied = await source.runMigrations();
    assert.equal(applied.length, 1);
    assert.equal(applied[0].name, 'AddReportPhotos1792800000000');
    assert.equal(await source.showMigrations(), false);
    let rows = await source.query('SELECT * FROM "WATER_REPORT"');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].photoUrl, null);
    assert.equal(rows[0].repairPhotoUrl, null);
    assert.equal(rows[0].address, 'Reporte anterior');

    const { Report } = require('../dist/reports/entities/report.entity');
    const { ReportsRepository } = require('../dist/reports/repositories/reports.repository');
    const repository = new ReportsRepository(source.getRepository(Report));
    const url = 'https://example.invalid/reports/test.png';
    await repository.create({ address: 'Reporte nuevo', description: 'Foto asociada', severity: 'high', reporterPhone: '4771234567' }, url);
    rows = await repository.findAll();
    assert.equal(rows.length, 2);
    assert.ok(rows.some(row => row.photoUrl === url && row.repairPhotoUrl === null));
    assert.equal((await source.runMigrations()).length, 0, 'Volver a ejecutar no debe repetir migraciones');
    await source.undoLastMigration();
    rows = await source.query('SELECT * FROM "WATER_REPORT"');
    assert.equal(rows.length, 2);
    assert.equal(Object.hasOwn(rows[0], 'photoUrl'), false);
    assert.equal((await source.query('SELECT * FROM "SYSTEM_USER"')).length, 1);
    console.log('OK: migración inicial, datos anteriores, nueva migración, persistencia de URLs, reejecución y reversión en PostgreSQL 16.');
  } finally {
    if (source?.isInitialized) await source.destroy();
    if (created) docker('rm', '--force', name);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
