import { Injectable } from '@nestjs/common';

type User = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
};

@Injectable()
export class UsersService {
  private users = new Map<string, User>();

  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async create(user: Omit<User, 'id'>) {
    const id = crypto.randomUUID();
    const created = { id, ...user };
    this.users.set(id, created);
    return created;
  }
}
