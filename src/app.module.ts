import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import appConfig from './common/config/app.config';
import databaseConfig from './common/config/database.config';
import finnhubConfig from './common/config/finnhub.config';

// Modules
import { DatabaseModule } from './modules/database/database.module';
import { CacheModule } from './modules/cache/cache.module';
import { FinnhubModule } from './modules/finnhub/finnhub.module';
import { SymbolModule } from './modules/symbol/symbol.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { StockModule } from './modules/stock/stock.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, finnhubConfig],
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Event handling
    EventEmitterModule.forRoot(),

    // Scheduling
    ScheduleModule.forRoot(),

    // Core modules
    DatabaseModule,
    CacheModule,

    // Feature modules
    FinnhubModule,
    SymbolModule,
    SchedulerModule,
    StockModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
