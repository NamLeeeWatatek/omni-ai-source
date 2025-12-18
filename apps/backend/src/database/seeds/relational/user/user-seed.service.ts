import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
  ) {}

  async run() {
    const existingUsers = await this.repository.count();
    
    if (existingUsers > 0) {
      console.log('ℹ️ Users already exist, skipping seed');
      return;
    }

    const users = [
      // Admin users
      {
        name: 'Super Admin',
        email: 'admin1@example.com',
        role: 'admin' as const,
        isActive: true,
      },
      {
        name: 'System Administrator',
        email: 'admin2@example.com',
        role: 'admin' as const,
        isActive: true,
      },
      
      // Regular users with different roles
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Emily Johnson',
        email: 'emily.johnson@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Sarah Davis',
        email: 'sarah.davis@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.anderson@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'James Taylor',
        email: 'james.taylor@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Robert Martinez',
        email: 'robert.martinez@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Jennifer Lee',
        email: 'jennifer.lee@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'William White',
        email: 'william.white@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Linda Harris',
        email: 'linda.harris@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Richard Clark',
        email: 'richard.clark@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Patricia Lewis',
        email: 'patricia.lewis@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Charles Walker',
        email: 'charles.walker@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Barbara Hall',
        email: 'barbara.hall@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Joseph Allen',
        email: 'joseph.allen@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Susan Young',
        email: 'susan.young@example.com',
        role: 'user' as const,
        isActive: true,
      },
      
      // Some inactive users for testing
      {
        name: 'Thomas King',
        email: 'thomas.king@example.com',
        role: 'user' as const,
        isActive: false,
      },
      {
        name: 'Jessica Wright',
        email: 'jessica.wright@example.com',
        role: 'user' as const,
        isActive: false,
      },
    ];

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash('secret', salt);

    const daysAgo = 365; // Spread user creation over the last year
    const now = new Date();

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const daysOffset = Math.floor(Math.random() * daysAgo);
      const hoursOffset = Math.floor(Math.random() * 24);
      
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysOffset);
      createdAt.setHours(createdAt.getHours() - hoursOffset);

      const user = this.repository.create({
        ...userData,
        password,
        createdAt,
        updatedAt: new Date(),
      });

      await this.repository.save(user);
    }

    console.log('✅ Users seeded successfully');
  }
}
