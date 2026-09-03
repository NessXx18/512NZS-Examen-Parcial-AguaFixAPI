import 'dotenv/config';
import * as env from 'env-var';

export const envs = {
  port: env.get('PORT').default('3000').asPortNumber(),
  corsOrigin: env.get('CORS_ORIGIN').default('').asString(),
  database: {
    host: env.get('DB_HOST').required().asString(),
    port: env.get('DB_PORT').default('5432').asPortNumber(),
    username: env.get('DB_USERNAME').required().asString(),
    password: env.get('DB_PASSWORD').required().asString(),
    name: env.get('DB_NAME').required().asString(),
  },
  mail: {
    host: env.get('MAIL_HOST').required().asString(),
    port: env.get('MAIL_PORT').default('587').asPortNumber(),
    secure: env.get('MAIL_SECURE').default('false').asBool(),
    user: env.get('MAIL_USER').required().asString(),
    password: env.get('MAIL_PASSWORD').required().asString(),
    from: env.get('MAIL_FROM').required().asString(),
    maintenanceEmail: env.get('MAINTENANCE_EMAIL').required().asEmailString(),
  },
};
