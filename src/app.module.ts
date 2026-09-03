import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config/envs';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './common/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.database.host,
      port: envs.database.port,
      username: envs.database.username,
      password: envs.database.password,
      database: envs.database.name,
      autoLoadEntities: true,
      synchronize: false,
    }),
    UsersModule,
    AuthModule,
    EmailModule,
    ReportsModule,
  ],
})
export class AppModule {}
