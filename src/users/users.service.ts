import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    if (await this.usersRepository.findByEmail(dto.email.toLowerCase())) {
      throw new ConflictException('Ya existe un usuario con este correo electrónico');
    }
    const user = await this.usersRepository.create(dto, await bcrypt.hash(dto.password, 10));
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }
}
