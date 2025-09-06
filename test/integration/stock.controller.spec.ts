import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/database/prisma.service';

describe('StockController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    if (process.env.NODE_ENV === 'test') {
      await prismaService.cleanDatabase();
    }
    await app.close();
  });

  describe('PUT /api/v1/stock/:symbol', () => {
    it('should start tracking a valid symbol', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/stock/AAPL')
        .expect(200);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('AAPL');
    });

    it('should return 400 for invalid symbol format', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/stock/invalid123')
        .expect(400);
    });

    it('should return 400 for too long symbol', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/stock/TOOLONG')
        .expect(400);
    });
  });

  describe('GET /api/v1/stock/:symbol', () => {
    beforeEach(async () => {
      // Start tracking AAPL before testing GET
      await request(app.getHttpServer()).put('/api/v1/stock/AAPL').expect(200);

      // Wait a moment for data to be fetched
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });

    it('should get stock data for tracked symbol', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/stock/AAPL')
        .expect(200);

      expect(response.body).toHaveProperty('symbol', 'AAPL');
      expect(response.body).toHaveProperty('currentPrice');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(response.body).toHaveProperty('movingAverage');
      expect(response.body).toHaveProperty('priceHistory');
      expect(Array.isArray(response.body.priceHistory)).toBe(true);
    });

    it('should return 404 for untracked symbol', async () => {
      await request(app.getHttpServer()).get('/api/v1/stock/ZZZZZ').expect(404);
    });

    it('should return 400 for invalid symbol format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/stock/invalid')
        .expect(400);
    });
  });

  describe('GET /api/v1/stock/:symbol/detailed', () => {
    it('should get detailed analytics for tracked symbol', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/stock/AAPL/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('symbol', 'AAPL');
      expect(response.body).toHaveProperty('currentPrice');
      expect(response.body).toHaveProperty('movingAverage');
      expect(response.body).toHaveProperty('priceChange');
      expect(response.body).toHaveProperty('percentChange');
      expect(response.body).toHaveProperty('tracking');
      expect(response.body.tracking).toHaveProperty('isActive');
      expect(response.body.tracking).toHaveProperty('jobStatus');
    });
  });

  describe('DELETE /api/v1/stock/:symbol', () => {
    it('should stop tracking a symbol', async () => {
      // First ensure the symbol is being tracked
      await request(app.getHttpServer()).put('/api/v1/stock/MSFT').expect(200);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/stock/MSFT')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('MSFT');
    });

    it('should return 404 for untracked symbol', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/stock/ZZZZZ')
        .expect(404);
    });
  });

  describe('GET /api/v1/stock', () => {
    it('should return list of tracked symbols', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/stock')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('symbol');
        expect(response.body[0]).toHaveProperty('isActive');
        expect(response.body[0]).toHaveProperty('checkInterval');
        expect(response.body[0]).toHaveProperty('jobStatus');
      }
    });
  });

  describe('GET /api/v1/stock/system/stats', () => {
    it('should return system statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/stock/system/stats')
        .expect(200);

      expect(response.body).toHaveProperty('activeJobs');
      expect(response.body).toHaveProperty('totalSymbols');
      expect(response.body).toHaveProperty('totalPrices');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memoryUsage');
    });
  });
});
