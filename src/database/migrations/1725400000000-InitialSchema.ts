import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1725400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "SYSTEM_USER" (
      "id" SERIAL NOT NULL,
      "name" character varying(100) NOT NULL,
      "email" character varying(150) NOT NULL,
      "password" character varying NOT NULL,
      "isNotificationEnabled" boolean NOT NULL DEFAULT true,
      CONSTRAINT "UQ_SYSTEM_USER_EMAIL" UNIQUE ("email"),
      CONSTRAINT "PK_SYSTEM_USER" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE TABLE "WATER_REPORT" (
      "id" SERIAL NOT NULL,
      "address" character varying(255) NOT NULL,
      "description" text NOT NULL,
      "severity" character varying(10) NOT NULL,
      "reporterPhone" character varying(30) NOT NULL,
      "isResolved" boolean NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      CONSTRAINT "PK_WATER_REPORT" PRIMARY KEY ("id"),
      CONSTRAINT "CHK_WATER_REPORT_SEVERITY" CHECK ("severity" IN ('low', 'medium', 'high'))
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "WATER_REPORT"');
    await queryRunner.query('DROP TABLE "SYSTEM_USER"');
  }
}
