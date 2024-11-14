import { SQSBatchResponse, SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import { SQSBatchItemFailure } from "aws-lambda/trigger/sqs";
import { ok, fail, Result } from "../types/result";
import {
  SendMessageCommand,
  SQSClient,
  SQSClientConfig,
} from "@aws-sdk/client-sqs";
import * as process from "node:process";
import { logger } from "../logger";
import { SpotRequest } from "./spot-request";
import { SpotResponse } from "./spot-response";

const sqsConfig: SQSClientConfig = process.env.LOCALSTACK_ENDPOINT
  ? { endpoint: process.env.LOCALSTACK_ENDPOINT }
  : {};
const sqsClient = new SQSClient(sqsConfig);
const destinationQueueUrl: string = process.env.DESTINATION_QUEUE_URL!;

export const handler: SQSHandler = async (
  event: SQSEvent
): Promise<SQSBatchResponse> => {
  const failedItems: SQSBatchItemFailure[] = [];

  for (const record of event.Records) {
    const result = await processRecord(record);
    if (!result.ok) {
      failedItems.push(result.error);
    }
  }

  return { batchItemFailures: failedItems };
};

async function processRecord(
  record: SQSRecord
): Promise<Result<void, SQSBatchItemFailure>> {
  logger.info("Received record: " + JSON.stringify(record));
  const input: SpotRequest = JSON.parse(record.body);
  const output: SpotResponse = {
    sub: input.out_sub,
    log_ids: input.log_ids,
    status: "ACCEPTED",
    reason: "STUB",
    claims: {
      "https://vocab.account.gov.uk/v1/coreIdentityJWT": "STUB_IDENTITY",
    },
  };
  const sendMessageCommand = new SendMessageCommand({
    QueueUrl: destinationQueueUrl,
    MessageBody: JSON.stringify(output),
  });
  try {
    logger.info(`Sending SPOT response for message ${record.messageId}`);
    await sqsClient.send(sendMessageCommand);
  } catch (error) {
    logger.error(error);
    return fail({ itemIdentifier: record.messageId });
  }

  return ok<void>(undefined);
}
