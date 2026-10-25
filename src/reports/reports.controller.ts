import { BadRequestException, Body, Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_PHOTO_SIZE } from '../storage/storage.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo', {
    storage: memoryStorage(),
    limits: { fileSize: MAX_PHOTO_SIZE, files: 1 },
  }))
  create(@Body() dto: CreateReportDto, @UploadedFile() photo: Express.Multer.File) {
    if (!photo) {
      throw new BadRequestException('Debes adjuntar una foto en el campo "photo"');
    }
    return this.reportsService.create(dto, photo);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }
}
