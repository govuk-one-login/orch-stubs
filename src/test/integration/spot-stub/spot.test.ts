import { SpotRequest } from "../../../main/spot-stub/spot-request";
import {
  CreateQueueCommand,
  PurgeQueueCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { getClientConfig, spotQueueName } from "../../../main/aws-config";

const sqsClient = new SQSClient(getClientConfig(false));
const lambdaClient = new LambdaClient(getClientConfig(false, 3002));

beforeAll(createSqsQueue);
afterEach(purgeQueue);

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

    const sqsMessage = generateSqsMessage(JSON.stringify(messageBody));

    const invokeCommand = new InvokeCommand({
      FunctionName: "SpotLambda",
      Payload: Buffer.from(JSON.stringify(sqsMessage)),
      InvocationType: "RequestResponse",
    });

    const { StatusCode, Payload } = await lambdaClient.send(invokeCommand);

    expect(StatusCode).toBe(200);
    const response = JSON.parse(Buffer.from(Payload!).toString());
    expect(response).toMatchObject({});
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
  });
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
    QueueName: spotQueueName,
  });
  const result = await sqsClient.send(command);
  console.log(result.$metadata);
}

async function getQueueItems() {
  const command: ReceiveMessageCommand = new ReceiveMessageCommand({
    QueueUrl: spotQueueName,
    MaxNumberOfMessages: 2,
    WaitTimeSeconds: 1,
  });
  const result = await sqsClient.send(command);
  return result.Messages;
}

async function purgeQueue() {
  const command: PurgeQueueCommand = new PurgeQueueCommand({
    QueueUrl: spotQueueName,
  });
  await sqsClient.send(command);
}
