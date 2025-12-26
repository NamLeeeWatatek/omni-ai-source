import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import bcrypt from 'bcryptjs';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleEnum } from '../roles/roles.enum';
import { Role } from '../roles/domain/role';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UserRepository) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    let password: string | undefined = undefined;

    if (createUserDto.password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(createUserDto.password, salt);
    }

    let email: string | null = null;

    if (createUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        createUserDto.email,
      );
      if (userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }
      email = createUserDto.email;
    }

    let name = createUserDto.name;
    if (!name && (createUserDto.firstName || createUserDto.lastName)) {
      name = [createUserDto.firstName, createUserDto.lastName]
        .filter(Boolean)
        .join(' ');
    }

    const user = await this.usersRepository.create({
      email,
      name,
      avatarUrl: createUserDto.avatarUrl,
      password,
      provider: createUserDto.provider ?? AuthProvidersEnum.email,
      providerId: createUserDto.providerId ?? createUserDto.socialId,
      isActive: createUserDto.isActive ?? true,
      role: createUserDto.role
        ? ({
          id: RoleEnum[createUserDto.role as keyof typeof RoleEnum],
          name: createUserDto.role,
        } as Role)
        : ({
          id: RoleEnum.user,
          name: 'user',
        } as Role),
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      socialId: createUserDto.socialId,
    });

    return user;
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    return this.usersRepository.findBySocialIdAndProvider({
      socialId,
      provider,
    });
  }

  async update(
    id: User['id'],
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const userObject = await this.usersRepository.findById(id);
      if (userObject && userObject?.password !== updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(updateUserDto.password, salt);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );
      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
      }
      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let name = updateUserDto.name;
    if (
      name === undefined &&
      (updateUserDto.firstName !== undefined ||
        updateUserDto.lastName !== undefined)
    ) {
      const currentUser = await this.usersRepository.findById(id);
      const firstName = updateUserDto.firstName ?? currentUser?.firstName;
      const lastName = updateUserDto.lastName ?? currentUser?.lastName;
      name = [firstName, lastName].filter(Boolean).join(' ') || null;
    }

    const updatedUser = await this.usersRepository.update(id, {
      email,
      name,
      avatarUrl: updateUserDto.avatarUrl,
      password,
      provider: updateUserDto.provider,
      providerId: updateUserDto.providerId ?? updateUserDto.socialId,
      isActive: updateUserDto.isActive,
      role:
        updateUserDto.role !== undefined
          ? typeof updateUserDto.role === 'string'
            ? ({
              id: RoleEnum[updateUserDto.role as keyof typeof RoleEnum],
              name: updateUserDto.role,
            } as Role)
            : (updateUserDto.role as Role | null)
          : undefined,
      roleId: updateUserDto.roleId,
      permissions: updateUserDto.permissions,
      emailVerifiedAt: updateUserDto.emailVerifiedAt,
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      socialId: updateUserDto.socialId,
    });

    return updatedUser;
  }

  async remove(id: User['id']): Promise<void> {
    const user = await this.usersRepository.findById(id);
    await this.usersRepository.remove(id);
  }

  async verifyEmail(id: User['id']): Promise<User | null> {
    return this.usersRepository.update(id, {
      emailVerifiedAt: new Date(),
    });
  }

  async deactivate(id: User['id']): Promise<User | null> {
    return this.usersRepository.update(id, {
      isActive: false,
    });
  }

  async activate(id: User['id']): Promise<User | null> {
    return this.usersRepository.update(id, {
      isActive: true,
    });
  }
}
