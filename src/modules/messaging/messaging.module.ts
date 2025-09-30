import { Module } from "@nestjs/common";
import { KafkaProducerService } from "./services/kafka-producer.service";
import { OutboxService } from "./services/outbox.service";
import { OutboxProcessorService } from "./services/outbox-processor.service";

@Module({
  providers: [KafkaProducerService, OutboxService, OutboxProcessorService],
  exports: [KafkaProducerService, OutboxService, OutboxProcessorService],
})
export class MessagingModule {}
