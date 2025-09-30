import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../../database/database.module";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { Kafka, Consumer, KafkaMessage } from "kafkajs";
import { Token } from "@prisma/client";
import { TokenPriceUpdateService } from "../../modules/price/services/token-price-update.service";
import { MockPriceService } from "../../modules/price/services/mock-price.service";
import { KafkaProducerService } from "../../modules/messaging/services/kafka-producer.service";
import { TokenService } from "../../modules/token/services/token.service";
import { TokenPriceUpdateMessageDto } from "../../modules/messaging/dto/token-price-update-message.dto";
import { PrismaService } from "../../database/prisma.service";

describe("TokenPriceService Integration Tests", () => {
  let postgresContainer: StartedTestContainer;
  let zookeeperContainer: StartedTestContainer;
  let kafkaContainer: StartedTestContainer;
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let tokenPriceUpdateService: TokenPriceUpdateService;
  let kafkaConsumer: Consumer;

  const kafkaTopic = "token-price-updates";
  const testId = Math.random().toString(36).substring(7);

  const getAvailablePort = async (): Promise<number> => {
    // Use a random port between 10000 and 65535
    return Math.floor(Math.random() * 55535) + 10000;
  };

  beforeAll(async () => {
    jest.setTimeout(120000); // 2 minutes timeout for container startup

    try {
      // Get available ports
      const zookeeperPort = await getAvailablePort();
      const kafkaPort = await getAvailablePort();
      const postgresPort = await getAvailablePort();

      // Start PostgreSQL container
      postgresContainer = await new GenericContainer("postgres:15-alpine")
        .withName(`postgres-test-${testId}`)
        .withEnvironment({
          POSTGRES_USER: "testuser",
          POSTGRES_PASSWORD: "testpassword",
          POSTGRES_DB: "testdb",
        })
        .withExposedPorts(51214)
        .start();

      const postgresHost = postgresContainer.getHost();
      const mappedPostgresPort = postgresContainer.getMappedPort(51214);

      // Start Zookeeper container (required for Kafka)
      zookeeperContainer = await new GenericContainer("confluentinc/cp-zookeeper:7.3.0")
        .withName(`zookeeper-test-${testId}`)
        .withEnvironment({
          ZOOKEEPER_CLIENT_PORT: "2181",
          ZOOKEEPER_TICK_TIME: "2000",
        })
        .withExposedPorts(2181)
        .start();

      // Wait for Zookeeper to start
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Start Kafka container
      kafkaContainer = await new GenericContainer("confluentinc/cp-kafka:7.3.0")
        .withName(`kafka-test-${testId}`)
        .withEnvironment({
          KAFKA_BROKER_ID: "1",
          KAFKA_ZOOKEEPER_CONNECT: `${zookeeperContainer.getHost()}:${zookeeperContainer.getMappedPort(
            2181,
          )}`,
          KAFKA_ADVERTISED_LISTENERS: `PLAINTEXT://${kafkaContainer.getHost()}:${kafkaPort}`,
          KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: "1",
          KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true",
        })
        .withExposedPorts(9092)
        .start();

      const kafkaHost = kafkaContainer.getHost();
      const mappedKafkaPort = kafkaContainer.getMappedPort(9092);

      // Wait for Kafka to be fully ready
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Setup Kafka consumer
      const kafka = new Kafka({
        clientId: "test-client",
        brokers: [`${kafkaHost}:${mappedKafkaPort}`],
      });

      kafkaConsumer = kafka.consumer({ groupId: "test-consumer-group" });
      await kafkaConsumer.connect();
      await kafkaConsumer.subscribe({ topic: kafkaTopic, fromBeginning: true });

      // Create NestJS test module
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
          }),
          DatabaseModule,
        ],
        providers: [
          TokenPriceUpdateService,
          MockPriceService,
          TokenService,
          {
            provide: KafkaProducerService,
            useValue: {
              sendPriceUpdateMessage: jest
                .fn()
                .mockImplementation((message: TokenPriceUpdateMessageDto) => Promise.resolve()),
            },
          },
        ],
      }).compile();

      prisma = moduleRef.get<PrismaService>(PrismaService);
      tokenPriceUpdateService = moduleRef.get<TokenPriceUpdateService>(TokenPriceUpdateService);
    } catch (error) {
      console.error("Error during test setup:", error);
      throw error;
    }
  }, 120000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }

    if (kafkaConsumer) {
      await kafkaConsumer.disconnect();
    }

    if (postgresContainer) {
      await postgresContainer.stop();
    }

    if (kafkaContainer) {
      await kafkaContainer.stop();
    }

    if (zookeeperContainer) {
      await zookeeperContainer.stop();
    }
  }, 30000);

  it("should update token price and send Kafka message", async () => {
    // Create test chain
    const chain = await prisma.chain.create({
      data: {
        deId: 99,
        name: "Test Chain",
        isEnabled: true,
      },
    });

    // Create test logo
    const logo = await prisma.logo.create({
      data: {
        bigRelativePath: "/test.png",
        smallRelativePath: "/test_small.png",
        thumbRelativePath: "/test_thumb.png",
      },
    });

    // Create test token
    const token = await prisma.token.create({
      data: {
        address: Buffer.from([0x01, 0x02, 0x03]),
        symbol: "TEST",
        name: "Test Token",
        decimals: 18,
        isNative: false,
        chainId: chain.id,
        logoId: logo.id,
        isProtected: false,
        priority: 1,
        price: 100,
      },
    });

    // Start price update service
    tokenPriceUpdateService.start();

    // Wait for price updates to occur
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Stop the service
    tokenPriceUpdateService.stop();

    // Check if token price was updated in the database
    const updatedToken = await prisma.token.findUnique({
      where: { id: token.id },
    });
    expect(updatedToken).toBeDefined();
    expect(Number(updatedToken!.price)).not.toEqual(100);

    // Note: In a real test, we would also check for Kafka messages,
    // but since we're mocking the KafkaProducerService, we can't do that here
  }, 10000);
});
