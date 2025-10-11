import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Chỉ dùng nội bộ cho Auth
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Tạo user mới (lưu ý truyền passwordHash)
  async create(params: {
    email: string;
    passwordHash: string;
    fullName?: string;
    role?: Role;
  }) {
    const { email, passwordHash, fullName, role } = params;
    return this.prisma.user.create({
      data: { email, passwordHash, fullName, role: role ?? 'USER' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      }, // không trả passwordHash
    });
  }

  // Lấy hồ sơ public (không gồm passwordHash)
  async findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Cập nhật hồ sơ cơ bản
  async updateProfile(id: string, data: { fullName?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
