# Deployment Guide

## Local Development (Docker Compose)

### 1. Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- 4GB+ RAM available

### 2. Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key variables:
- `JWT_SECRET`: Change to a secure random string
- `POSTGRES_PASSWORD`: Change for production
- `CORS_ORIGIN`: Set to your frontend domain

### 3. Start All Services

```bash
docker-compose up -d
```

### 4. Verify

```bash
# Check all services are running
docker-compose ps

# Check API Gateway health
curl http://localhost:3000/health

# Check service logs
docker-compose logs -f api-gateway
```

### 5. Stop

```bash
docker-compose down          # Stop services
docker-compose down -v       # Stop and remove volumes
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Set a strong `JWT_SECRET` (32+ chars)
- [ ] Configure `CORS_ORIGIN` to your domain only
- [ ] Enable HTTPS/TLS termination
- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL connection pooling
- [ ] Set up Redis password authentication
- [ ] Enable rate limiting appropriate for your scale
- [ ] Set up database backups
- [ ] Configure log aggregation

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | Token signing secret | `change-me` |
| `POSTGRES_HOST` | Database host | `postgres` |
| `POSTGRES_PORT` | Database port | `5432` |
| `POSTGRES_USER` | Database user | `nepse_user` |
| `POSTGRES_PASSWORD` | Database password | `change_me_in_production` |
| `POSTGRES_DB` | Database name | `nepse_analytics` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

### Scaling Considerations

- **Horizontal Scaling**: Each service can be independently scaled
- **Database**: Consider read replicas for analytics queries
- **Caching**: Redis cluster for high availability
- **Load Balancing**: Use Nginx or cloud load balancer in front of API Gateway

### Monitoring

Recommended monitoring stack:
- **Metrics**: Prometheus + Grafana
- **Logging**: ELK Stack or Loki
- **APM**: Datadog or New Relic
- **Uptime**: Healthcheck endpoints on each service
