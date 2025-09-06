import { ApiProperty } from '@nestjs/swagger';

export class PriceHistoryDto {
  @ApiProperty({ example: 150.25, description: 'Stock price' })
  price: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Timestamp of the price',
  })
  timestamp: Date;
}

export class StockResponseDto {
  @ApiProperty({ example: 'AAPL', description: 'Stock symbol' })
  symbol: string;

  @ApiProperty({ example: 150.25, description: 'Current stock price' })
  currentPrice: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Last update timestamp',
  })
  lastUpdated: Date;

  @ApiProperty({
    example: 149.75,
    description: 'Moving average of last 10 prices',
  })
  movingAverage: number;

  @ApiProperty({
    type: [PriceHistoryDto],
    description: 'Historical price data',
    isArray: true,
  })
  priceHistory: PriceHistoryDto[];
}

export class TrackingStatusDto {
  @ApiProperty({ example: true, description: 'Whether tracking is active' })
  isActive: boolean;

  @ApiProperty({
    example: 60000,
    description: 'Check interval in milliseconds',
  })
  checkInterval: number;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Last check timestamp',
  })
  lastChecked: Date | null;

  @ApiProperty({ example: 'ACTIVE', description: 'Job status' })
  jobStatus: string;

  @ApiProperty({ example: 0, description: 'Number of consecutive errors' })
  errorCount: number;

  @ApiProperty({ example: null, description: 'Last error message if any' })
  lastError: string | null;
}

export class DetailedStockResponseDto extends StockResponseDto {
  @ApiProperty({ example: 1.25, description: 'Price change in last 24 hours' })
  priceChange: number;

  @ApiProperty({
    example: 0.84,
    description: 'Percent change in last 24 hours',
  })
  percentChange: number;

  @ApiProperty({
    example: 152.5,
    description: 'Highest price in last 24 hours',
  })
  high24h: number;

  @ApiProperty({
    example: 148.75,
    description: 'Lowest price in last 24 hours',
  })
  low24h: number;

  @ApiProperty({
    example: 1234567,
    description: 'Trading volume in last 24 hours',
  })
  volume24h: number;

  @ApiProperty({
    type: TrackingStatusDto,
    description: 'Tracking status information',
  })
  tracking: TrackingStatusDto;
}
