import { SQSEvent } from "aws-lambda";
import { SpotRequest } from "../../../main/spot-stub/spot-request";
import { handler } from "../../../main/spot-stub/spot";
import * as process from "node:process";
import {
  CreateQueueCommand,
  PurgeQueueCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ endpoint: process.env.LOCALSTACK_ENDPOINT });

beforeAll(async () => {
  await createSqsQueue();
});

afterEach(async () => {
  await purgeQueue();
});

describe("SPOT stub handler", () => {
  it("Should return the correct value", async () => {
    const messageBody: SpotRequest = {
      in_claims: {},
      in_local_account_id: "",
      in_rp_sector_id: "",
      in_salt: "",
      log_ids: {
        sessionId: "",
        persistentSessionId: "",
        requestId: "",
        clientId: "",
        clientSessionId: "",
      },
      out_audience: "",
      out_sub: "",
    };
    const input: SQSEvent = generateSqsMessage(JSON.stringify(messageBody));

    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const response = await handler(input, null as any, null as any);

    expect(response).toEqual({ batchItemFailures: [] });
    const queueItems = await getQueueItems();
    expect(queueItems?.length).toBe(1);
    const queueResponseBody = JSON.parse(queueItems![0].Body!);
    expect(queueResponseBody).toEqual({
      claims: {
        "https://vocab.account.gov.uk/v1/coreIdentityJWT": "STUB_IDENTITY",
      },
      log_ids: {
        clientId: "",
        clientSessionId: "",
        persistentSessionId: "",
        requestId: "",
        sessionId: "",
      },
      reason: "STUB",
      status: "ACCEPTED",
      sub: "",
    });
  }, 10000);
});

function generateSqsMessage(body: string) {
  return {
    Records: [
      {
        body: body,
        messageId: "test-message",
        receiptHandle: "",
        attributes: {
          ApproximateReceiveCount: "",
          SentTimestamp: "",
          SenderId: "",
          ApproximateFirstReceiveTimestamp: "",
        },
        messageAttributes: {},
        md5OfBody: "",
        eventSource: "",
        eventSourceARN: "",
        awsRegion: "",
      },
    ],
  };
}

async function createSqsQueue() {
  const command: CreateQueueCommand = new CreateQueueCommand({
    QueueName: process.env.QUEUE_NAME,
  });
  await sqsClient.send(command);
}

async function getQueueItems() {
  const command: ReceiveMessageCommand = new ReceiveMessageCommand({
    QueueUrl: process.env.DESTINATION_QUEUE_URL,
    MaxNumberOfMessages: 2,
    WaitTimeSeconds: 1,
  });
  const result = await sqsClient.send(command);
  return result.Messages;
}

async function purgeQueue() {
  const command: PurgeQueueCommand = new PurgeQueueCommand({
    QueueUrl: process.env.DESTINATION_QUEUE_URL,
  });
  await sqsClient.send(command);
}
