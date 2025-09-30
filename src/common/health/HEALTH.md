# HealthModule

## Зачем нужен
- Модуль собирает все проверки состояния сервиса и отвечает за маршруты `/health/*`.
- `HealthController` запускает набор индикаторов и возвращает овьет.

## Что подключено
- `TerminusModule` — базовый инструмент NestJS для хелфчек [[источник]](https://docs.nestjs.com/recipes/terminus).
- `MessagingModule` — дает кафка продюсер и outbox процессор.
- `PriceModule` — поднимает `CircuitBreakerService`, чтобы проверять внешний сервис цен.

## Какие проверки есть
- `PrismaHealthIndicator` — делает `SELECT 1` через `PrismaService`, чтобы убедиться, что база отвечает.
- `KafkaHealthIndicator` — вызывает `KafkaProducerService.healthCheck()` и проверяет статус подключения.
- `OutboxHealthIndicator` — читает статистику `OutboxProcessorService` и следит, чтобы в очереди не скапливались события.
- `CircuitBreakerHealthIndicator` — проверяет, не ушел ли предохранитель `CircuitBreakerService` в состояние `OPEN`.
- Память и диск контролируют стандартные `MemoryHealthIndicator` и `DiskHealthIndicator` из терминус.

## Эндпоинты
- `GET /health` — собирает общий отчет. Лимиты: 300 МБ на heap/RSS и 90% занятости диска.
- `GET /health/database` — только статус базы.
- `GET /health/kafka` — только кафка.
- `GET /health/outbox` — следит, чтобы в очереди было меньше 1000 задач.
- `GET /health/circuit-breaker` — показывает состояние `MockPriceService`.
- `GET /health/memory` — отдельный чек heap/RSS.
- `GET /health/disk` — отдельный чек диска.

## Что отдает
- При успехе вернется `status: "ok"` и  метаданные.
- Если индикатор падает, Terminus вернет `status: "error"` и описание проблемы, чтобы мониторинг смог отреагировать.
