import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateTrackingDto {
  @ApiProperty({
    example: 'AAPL',
    description: 'Stock symbol to track (1-5 uppercase letters)',
    pattern: '^[A-Z]{1,5}$',
  })
  @IsString()
  @Matches(/^[A-Z]{1,5}$/, {
    message: 'Symbol must be 1-5 uppercase letters',
  })
  symbol: string;

  @ApiProperty({
    example: 60000,
    description: 'Check interval in milliseconds (optional, default 60000)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(10000, { message: 'Check interval must be at least 10 seconds' })
  checkInterval?: number;
}

export class StartTrackingResponseDto {
  @ApiProperty({
    example: 'AAPL-123e4567-e89b-12d3-a456-426614174000',
    description: 'Job ID',
  })
  jobId: string;

  @ApiProperty({
    example: 'Started tracking AAPL',
    description: 'Success message',
  })
  message: string;
}

export class StopTrackingResponseDto {
  @ApiProperty({
    example: 'Stopped tracking AAPL',
    description: 'Success message',
  })
  message: string;
}

export class TrackedSymbolDto {
  @ApiProperty({ example: 'AAPL', description: 'Stock symbol' })
  symbol: string;

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
}
