import { SQSBatchResponse, SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import { SQSBatchItemFailure } from "aws-lambda/trigger/sqs";
import { ok, fail, Result } from "../types/result";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { logger } from "../logger";
import { SpotRequest } from "./spot-request";
import { SpotResponse } from "./spot-response";
import { getClientConfig, getSpotDestinationQueueUrl } from "../aws-config";

const sqsClient = new SQSClient(getClientConfig(true));

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
    QueueUrl: getSpotDestinationQueueUrl(true),
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
