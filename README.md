# Token Price Service Challenge

This repository contains a Node.js challenge task implementing a Token Price Service with intentional anti-patterns and
bugs for educational purposes.

## Project Structure

The repository is organized as follows:

- **src/**: The main project directory containing:
    - **data/**: Database context and seeder
    - **kafka/**: Kafka producer service
    - **migrations/**: Database migrations
    - **models/**: Token and message models
    - **services/**: Price update and mock services
    - **test/**: Integration tests

## Technology Stack

- **Node.js**: JavaScript runtime
- **TypeScript**: For type safety
- **Nest.js**: Node.js framework for building efficient and scalable server-side applications
- **PostgreSQL**: For data storage
- **Prisma**: Modern ORM with type-safe queries and migrations
- **Kafka.js**: For message brokering
- **Jest**: For testing
- **Testcontainers**: For integration testing with Docker containers

## Getting Started

See the [src/README.md](./src/README.md) for detailed instructions on how to run the application and tests.

## Features

- Token price updates with a mock price service
- Kafka integration for price update messages
- PostgreSQL database with denormalized structure
- Integration tests using Testcontainers

## License

This project is for educational purposes only.
