# Stock Price Checker

Simple REST API that tracks stock prices and calculates moving averages. Built with NestJS, TypeScript, and PostgreSQL.

## Quick Start

1. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your Finnhub API key
```

2. Start with Docker:
```bash
docker-compose up -d
```

API available at: `http://localhost:3000/api/v1`

## API Endpoints

- `PUT /api/v1/stock/AAPL` - Start tracking a stock
- `GET /api/v1/stock/AAPL` - Get current price and moving average  
- `DELETE /api/v1/stock/AAPL` - Stop tracking
- `GET /api/v1/stock` - List all tracked stocks
- `GET /api/v1/health` - Health check

**Swagger UI**: `http://localhost:3000/api/docs`  
**Postman Collection**: `docs/postman/Stock_Price_Checker_API.postman_collection.json`

## Development

For local development without Docker:
```bash
npm install
npm run start:dev
npm test
```