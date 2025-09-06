import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
      : true;

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Stock Price Checker API')
    .setDescription(
      'Simple Stock Price Checker API with periodic price tracking and moving average calculation',
    )
    .setVersion('1.0')
    .addTag('Stock', 'Stock price tracking endpoints')
    .addTag('Health', 'Simple health check endpoint')
    .addServer(`http://localhost:${port}/${apiPrefix}`, 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Stock Price Checker API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
      filter: true,
      showRequestDuration: true,
    },
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  process.on('SIGTERM', () => {
    logger.warn('SIGTERM signal received: closing HTTP server');
    void app.close();
  });

  process.on('SIGINT', () => {
    logger.warn('SIGINT signal received: closing HTTP server');
    void app.close();
  });

  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(
    `📚 API Documentation available at: http://localhost:${port}/api/docs`,
  );
  logger.log(
    `🏥 Health check available at: http://localhost:${port}/${apiPrefix}/health`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
