import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly repository: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto, hashedPassword: string): Promise<User> {
    const user = this.repository.create({ ...dto, email: dto.email.toLowerCase(), password: hashedPassword });
    return this.repository.save(user);
  }
}
