import 'dotenv/config';
import { DataSource } from 'typeorm';
import { envs } from '../config/envs';
import { User } from '../users/entities/user.entity';
import { Report } from '../reports/entities/report.entity';

export default new DataSource({
  type: 'postgres',
  host: envs.database.host,
  port: envs.database.port,
  username: envs.database.username,
  password: envs.database.password,
  database: envs.database.name,
  entities: [User, Report],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
