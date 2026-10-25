import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportPhotos1792800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "WATER_REPORT" ADD "photoUrl" text, ADD "repairPhotoUrl" text');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "WATER_REPORT" DROP COLUMN "repairPhotoUrl", DROP COLUMN "photoUrl"');
  }
}
