import { SQSBatchResponse, SQSEvent, SQSHandler, SQSRecord } from "aws-lambda";
import { SQSBatchItemFailure } from "aws-lambda/trigger/sqs";
import { ok, fail, Result } from "../types/result.ts";
import {
  SendMessageCommand,
  SQSClient,
  SQSClientConfig,
} from "@aws-sdk/client-sqs";
import * as process from "node:process";
import { logger } from "../logger.ts";
import { SpotRequest } from "./spot-request.ts";
import { SpotResponse } from "./spot-response.ts";
import { SignJWT } from "jose";
import { generateKeyPairSync } from "node:crypto";

const sqsConfig: SQSClientConfig = process.env.SQS_ENDPOINT
  ? { endpoint: process.env.SQS_ENDPOINT }
  : {};
const sqsClient = new SQSClient(sqsConfig);
const destinationQueueUrl: string = process.env.DESTINATION_QUEUE_URL!;
const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: "spki",
    format: "jwk",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "jwk",
  },
});

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
      "https://vocab.account.gov.uk/v1/coreIdentityJWT":
        await createCoreIdentityJwt(),
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

const createCoreIdentityJwt = async () => {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: "3NKFv679oYlMdyrhKErrTGbzBy2h8rrd",
    sub: "urn:fdc:gov.uk:2022:95S4a38abnez3SPmGmzU_J9_9_xGoylvIO65LZmCvpY",
    nbf: now,
    iss: "https://test-issuer.gov.uk/",
    vot: "P2",
    exp: now + 1800,
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
  };
  return new SignJWT(claims)
    .setProtectedHeader({
      kid: "test-kid",
      alg: "RSA-OAEP-256",
    })
    .sign(privateKey);
};
