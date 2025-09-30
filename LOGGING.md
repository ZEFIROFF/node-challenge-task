# Настройка логирования

## Переменные окружения

### LOG_LEVEL
Уровень логирования приложения:
- `log` (по умолчанию) - только важные сообщения (error, warn, log)
- `debug` - включает debug логи
- `verbose` - включает verbose логи

### PRISMA_LOG_LEVEL
Уровень логирования Prisma:
- `warn` (по умолчанию) - только предупреждения и ошибки
- `info` - информационные сообщения
- `query` - все SQL запросы (детально)

### KAFKAJS_NO_PARTITIONER_WARNING
- `1` - отключает предупреждение про партиционер

## Примеры настроек

### Production (минимум логов)
```env
LOG_LEVEL=log
PRISMA_LOG_LEVEL=error
KAFKAJS_NO_PARTITIONER_WARNING=1
```

### Development (стандартные логи)
```env
LOG_LEVEL=log
PRISMA_LOG_LEVEL=warn
KAFKAJS_NO_PARTITIONER_WARNING=1
```

### Debug (все логи)
```env
LOG_LEVEL=debug
PRISMA_LOG_LEVEL=query
KAFKAJS_NO_PARTITIONER_WARNING=1
```

## Типы логов

- **ERROR** - критические ошибки
- **WARN** - предупреждения
- **LOG** - важные события
- **DEBUG** - детальная отладка
- **VERBOSE** - максимально детальное логирование
