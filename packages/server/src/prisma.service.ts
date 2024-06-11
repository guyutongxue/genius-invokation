import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

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
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    const count = await this.user.count({
      where: { email: process.env.ADMIN_EMAIL },
    });
    if (!count) {
      const [salt, key] = await createPassword(process.env.ADMIN_PASSWORD!);
      await this.user.create({
        data: {
          email: process.env.ADMIN_EMAIL!,
          password: Buffer.from(key),
          salt: Buffer.from(salt),
          rank: 0,
        },
      });
    }
  }
}
