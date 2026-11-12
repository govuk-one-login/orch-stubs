import { SQSEvent } from "aws-lambda";
import { SpotRequest } from "../../../main/spot-stub/spot-request.ts";
import { handler } from "../../../main/spot-stub/spot.ts";
import * as process from "node:process";
import {
  CreateQueueCommand,
  PurgeQueueCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { decodeJwt } from "jose";

const sqsClient = new SQSClient({ endpoint: process.env.SQS_ENDPOINT });
const mockNow = 1516239022;

describe("SPOT stub handler", () => {
  beforeAll(async () => {
    await createSqsQueue();
    vi.useFakeTimers();
    vi.setSystemTime(mockNow);
  });

  afterEach(async () => {
    await purgeQueue();
  });

  it("should return the correct value", async () => {
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

    expect(response).toStrictEqual({ batchItemFailures: [] });

    const queueItems = await getQueueItems();

    expect(queueItems?.length).toBe(1);

    const queueResponseBody = JSON.parse(queueItems![0].Body!);

    expect(queueResponseBody.log_ids).toStrictEqual({
      clientId: "",
      clientSessionId: "",
      persistentSessionId: "",
      requestId: "",
      sessionId: "",
    });
    expect(queueResponseBody.reason).toBe("STUB");
    expect(queueResponseBody.sub).toBe("");
    expect(queueResponseBody.status).toBe("ACCEPTED");

    const claimsJwt = decodeJwt(
      queueResponseBody.claims[
        "https://vocab.account.gov.uk/v1/coreIdentityJWT"
      ]
    );

    expect(claimsJwt).toStrictEqual({
      aud: "3NKFv679oYlMdyrhKErrTGbzBy2h8rrd",
      sub: "urn:fdc:gov.uk:2022:95S4a38abnez3SPmGmzU_J9_9_xGoylvIO65LZmCvpY",
      nbf: mockNow,
      iss: "https://test-issuer.gov.uk/",
      vot: "P2",
      exp: mockNow + 1800,
      vc: {
        type: ["VerifiableCredential", "IdentityCheckCredential"],
        credentialSubject: {
          birthDate: [
            {
              value: "1965-07-08",
            },
          ],
          name: [
            {
              nameParts: [
                {
                  type: "GivenName",
                  value: "KENNETH",
                },
                {
                  type: "FamilyName",
                  value: "DECERQUEIRA",
                },
              ],
            },
          ],
        },
      },
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
