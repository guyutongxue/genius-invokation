// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../db/prisma.service";
import { User } from "@prisma/client";
import { deepEquals } from "bun";

async function calcPassword(
  password: string,
  salt: Uint8Array,
): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const encoded = enc.encode(password);
  const keyMat = await crypto.subtle.importKey(
    "raw",
    encoded,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 10000,
      hash: "SHA-256",
    },
    keyMat,
    256,
  );
  return bits;
}

async function createPassword(
  password: string,
): Promise<[Uint8Array, ArrayBuffer]> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await calcPassword(password, salt);
  return [salt, key];
}

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const admin = await this.findByEmail(process.env.ADMIN_EMAIL!);
    if (!admin) {
      await this.create(
        process.env.ADMIN_EMAIL!,
        process.env.ADMIN_PASSWORD!,
        0,
      );
    }
  }

  private async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { email },
    });
  }
  async findById(id: number): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { id },
    });
  }

  async create(email: string, password: string, rank?: number) {
    const [salt, key] = await createPassword(password);
    await this.prisma.user.create({
      data: {
        email,
        password: Buffer.from(key),
        salt: Buffer.from(salt),
        rank,
      },
    });
  }

  async updateName(id: number, name: string) {
    await this.prisma.user.update({
      where: { id },
      data: { name },
    });
  }
  async updatePassword(id: number, password: string) {
    const [salt, key] = await createPassword(password);
    await this.prisma.user.update({
      where: { id },
      data: {
        password: Buffer.from(key),
        salt: Buffer.from(salt),
      },
    });
  }
  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }
    const key = await calcPassword(password, user.salt);
    if (deepEquals(Buffer.from(key), user.password)) {
      return user;
    } else {
      return null;
    }
  }
}
