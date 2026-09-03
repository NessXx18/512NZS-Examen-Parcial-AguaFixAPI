import { Injectable } from '@nestjs/common';
import { envs } from '../config/envs';
import { EmailService } from '../common/email/email.service';
import { CreateReportDto } from './dto/create-report.dto';
import { Report } from './entities/report.entity';
import { ReportsRepository } from './repositories/reports.repository';
import { generateReportTemplate } from './templates/report.template';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateReportDto): Promise<Report> {
    const report = await this.reportsRepository.create(dto);
    await this.emailService.sendEmail(
      envs.mail.maintenanceEmail,
      `Nueva fuga de agua: ${dto.severity}`,
      generateReportTemplate(dto),
    );
    return report;
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepository.findAll();
  }
}
