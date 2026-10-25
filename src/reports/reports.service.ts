import { Injectable } from '@nestjs/common';
import { envs } from '../config/envs';
import { EmailService } from '../common/email/email.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Report } from './entities/report.entity';
import { ReportsRepository } from './repositories/reports.repository';
import { generateReportTemplate } from './templates/report.template';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  async create(dto: CreateReportDto, photo: Express.Multer.File): Promise<Report> {
    const photoUrl = await this.storageService.uploadFile(photo, 'reports/');
    const report = await this.reportsRepository.create(dto, photoUrl);
    await this.emailService.sendEmail(
      envs.mail.maintenanceEmail,
      `Nueva fuga de agua: ${dto.severity}`,
      generateReportTemplate(dto, photoUrl),
    );
    return report;
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepository.findAll();
  }
}
