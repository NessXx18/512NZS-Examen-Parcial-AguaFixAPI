import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn(['low', 'medium', 'high'])
  severity!: 'low' | 'medium' | 'high';

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  reporterPhone!: string;
}
