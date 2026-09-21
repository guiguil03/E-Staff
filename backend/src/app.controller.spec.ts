import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the API health string', () => {
      expect(appController.getHealth()).toBe('e-Staf API — OK');
    });
  });

  describe('getHealthCheck', () => {
    it("renvoie status ok quand la base de données répond", async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const result = await appController.getHealthCheck();
      expect(result.status).toBe('ok');
      expect(result.database).toBe(true);
    });

    it('renvoie une HttpException 503 quand la base de données ne répond pas', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
      await expect(appController.getHealthCheck()).rejects.toThrow(HttpException);
      await expect(appController.getHealthCheck()).rejects.toMatchObject({
        status: 503,
      });
    });
  });
});
