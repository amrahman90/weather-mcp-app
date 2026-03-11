# ADR-002: Layered Architecture for Weather Server

## Status

Accepted

## Context

The initial implementation had all server logic in a single file. This made the code:
- Difficult to test in isolation
- Hard to maintain
- Mixed concerns inappropriately

## Decision

Implement layered architecture with clear separation:

```
Handler Layer (weather-handler.ts)
    ↓
Service Layer (weather-formatter.ts)
    ↓
API Layer (weather-client.ts)
```

### Handler Layer

- Input validation
- Rate limiting
- Orchestration of API calls
- Response formatting

### Service Layer

- Pure formatting functions
- No side effects
- Stateless utilities

### API Layer

- External API calls
- Response validation
- Error handling for network issues

## Consequences

### Positive

- Each layer testable independently
- Clear dependency flow
- Easier to swap implementations
- ~82 lines for server.ts (was 200+)

### Negative

- More files to manage
- Slight indirection overhead

## Implementation

1. Created `src/api/weather-client.ts` - API calls
2. Created `src/services/weather-formatter.ts` - Formatting
3. Created `src/handlers/weather-handler.ts` - Orchestration
4. Updated `server.ts` to use new structure

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- ADR-001: Zod Version Selection
