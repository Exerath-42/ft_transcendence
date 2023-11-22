import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@BDD_postgresSQL:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}?schema=public`,
        },
      },
    });
  }
}
