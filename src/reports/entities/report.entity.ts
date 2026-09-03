import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'WATER_REPORT' })
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  address!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 10 })
  severity!: 'low' | 'medium' | 'high';

  @Column({ length: 30 })
  reporterPhone!: string;

  @Column({ default: false })
  isResolved!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
