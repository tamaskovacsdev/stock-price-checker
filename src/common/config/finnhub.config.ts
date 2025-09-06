import { registerAs } from '@nestjs/config';

export default registerAs('finnhub', () => {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error(
      'FINNHUB_API_KEY is required but not provided in environment variables',
    );
  }

  return {
    apiKey,
    baseUrl: process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1',
    timeout: parseInt(process.env.FINNHUB_TIMEOUT || '10000', 10),
    retryAttempts: parseInt(process.env.FINNHUB_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.FINNHUB_RETRY_DELAY || '1000', 10),
  };
});
