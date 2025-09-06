import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import {
  StockResponseDto,
  DetailedStockResponseDto,
} from '../dto/stock-response.dto';
import {
  StartTrackingResponseDto,
  StopTrackingResponseDto,
  TrackedSymbolDto,
} from '../dto/create-tracking.dto';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Put(':symbol')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start tracking a stock symbol' })
  @ApiParam({
    name: 'symbol',
    description: 'Stock symbol (1-5 uppercase letters)',
    example: 'AAPL',
  })
  @ApiResponse({
    status: 200,
    description: 'Tracking started successfully',
    type: StartTrackingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid symbol format' })
  @ApiNotFoundResponse({ description: 'Symbol not found or not supported' })
  @ApiServiceUnavailableResponse({ description: 'External API error' })
  async startTracking(
    @Param('symbol') symbol: string,
  ): Promise<StartTrackingResponseDto> {
    return this.stockService.startTracking(symbol.toUpperCase());
  }

  @Get(':symbol')
  @ApiOperation({ summary: 'Get stock price and moving average' })
  @ApiParam({
    name: 'symbol',
    description: 'Stock symbol (1-5 uppercase letters)',
    example: 'AAPL',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock data retrieved successfully',
    type: StockResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid symbol format' })
  @ApiNotFoundResponse({ description: 'Symbol not found or not being tracked' })
  async getStock(@Param('symbol') symbol: string): Promise<StockResponseDto> {
    return this.stockService.getStockData(symbol.toUpperCase());
  }

  @Get(':symbol/detailed')
  @ApiOperation({ summary: 'Get detailed stock analytics' })
  @ApiParam({
    name: 'symbol',
    description: 'Stock symbol (1-5 uppercase letters)',
    example: 'AAPL',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed stock analytics retrieved successfully',
    type: DetailedStockResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid symbol format' })
  @ApiNotFoundResponse({ description: 'Symbol not found or not being tracked' })
  async getDetailedStock(
    @Param('symbol') symbol: string,
  ): Promise<DetailedStockResponseDto> {
    return this.stockService.getDetailedAnalytics(
      symbol.toUpperCase(),
    ) as Promise<DetailedStockResponseDto>;
  }

  @Delete(':symbol')
  @ApiOperation({ summary: 'Stop tracking a stock symbol' })
  @ApiParam({
    name: 'symbol',
    description: 'Stock symbol (1-5 uppercase letters)',
    example: 'AAPL',
  })
  @ApiResponse({
    status: 200,
    description: 'Tracking stopped successfully',
    type: StopTrackingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid symbol format' })
  @ApiNotFoundResponse({ description: 'Symbol not being tracked' })
  async stopTracking(
    @Param('symbol') symbol: string,
  ): Promise<StopTrackingResponseDto> {
    return this.stockService.stopTracking(symbol.toUpperCase());
  }

  @Get()
  @ApiOperation({ summary: 'Get all tracked symbols' })
  @ApiResponse({
    status: 200,
    description: 'List of tracked symbols',
    type: [TrackedSymbolDto],
  })
  async getTrackedSymbols(): Promise<TrackedSymbolDto[]> {
    return this.stockService.getTrackedSymbols();
  }

  @Get('system/stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({
    status: 200,
    description: 'System statistics',
  })
  async getSystemStats() {
    return this.stockService.getSystemStats();
  }
}
