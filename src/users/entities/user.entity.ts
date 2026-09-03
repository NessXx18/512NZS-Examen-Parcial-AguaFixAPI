import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'SYSTEM_USER' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 150 })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: true })
  isNotificationEnabled!: boolean;
}
