import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import {
  FinnhubQuote,
  StockQuote,
  FinnhubError,
} from '../interfaces/finnhub.interface';
import { FinnhubQuoteSchema } from '../schemas/finnhub.schema';

@Injectable()
export class FinnhubService {
  private readonly logger = new Logger(FinnhubService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('finnhub.apiKey')!;
    const baseUrl = this.configService.get<string>('finnhub.baseUrl')!;
    const timeout = this.configService.get<number>('finnhub.timeout')!;

    this.client = axios.create({
      baseURL: baseUrl,
      timeout,
      headers: {
        'X-Finnhub-Token': this.apiKey,
      },
    });

    // Configure retry logic
    axiosRetry(this.client, {
      retries: this.configService.get<number>('finnhub.retryAttempts') || 3,
      retryDelay: (retryCount) => {
        const delay =
          this.configService.get<number>('finnhub.retryDelay') || 1000;
        return delay * Math.pow(2, retryCount - 1); // Exponential backoff
      },
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx errors
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false)
        );
      },
      onRetry: (retryCount, error) => {
        this.logger.warn(
          `Retrying Finnhub API request (attempt ${retryCount}): ${error.message}`,
        );
      },
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Finnhub API response: ${response.config.url} - ${response.status}`,
        );
        return response;
      },
      (error: AxiosError) => {
        this.logger.error(
          `Finnhub API error: ${error.config?.url} - ${error.response?.status} - ${error.message}`,
        );
        return Promise.reject(error);
      },
    );
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    try {
      const response = await this.client.get<FinnhubQuote>('/quote', {
        params: { symbol: symbol.toUpperCase() },
      });

      // Validate API response with Zod
      const validationResult = FinnhubQuoteSchema.safeParse(response.data);

      if (!validationResult.success) {
        this.logger.error(
          'Invalid Finnhub quote response:',
          validationResult.error,
        );
        throw new ServiceUnavailableException(
          'Finnhub',
          `Invalid API response format for symbol ${symbol}`,
        );
      }

      const quote = validationResult.data;

      // Check if we got valid data
      if (quote.c === 0) {
        throw new ServiceUnavailableException(
          'Finnhub',
          `No data available for symbol ${symbol}`,
        );
      }

      return {
        symbol: symbol.toUpperCase(),
        price: quote.c,
        timestamp: new Date(quote.t * 1000),
        change: quote.d || undefined,
        percentChange: quote.dp || undefined,
        high: quote.h,
        low: quote.l,
        open: quote.o,
        previousClose: quote.pc,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as FinnhubError;

        if (error.response?.status === 403) {
          throw new ServiceUnavailableException(
            'Finnhub',
            'API key is invalid or rate limit exceeded',
          );
        }

        if (error.response?.status === 404) {
          throw new ServiceUnavailableException(
            'Finnhub',
            `Symbol ${symbol} not found`,
          );
        }

        if (error.response?.status === 429) {
          throw new ServiceUnavailableException(
            'Finnhub',
            'Rate limit exceeded',
          );
        }

        throw new ServiceUnavailableException(
          'Finnhub',
          errorData?.error || error.message || 'Unknown error occurred',
        );
      }

      throw error;
    }
  }

  async validateSymbol(symbol: string): Promise<boolean> {
    try {
      const quote = await this.getQuote(symbol);
      return quote.price > 0;
    } catch (error) {
      this.logger.warn(
        `Symbol validation failed for ${symbol}: ${String(error)}`,
      );
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Try to get a quote for a known symbol (AAPL)
      await this.getQuote('AAPL');
      return true;
    } catch (error) {
      this.logger.error('Finnhub health check failed:', error);
      return false;
    }
  }
}
