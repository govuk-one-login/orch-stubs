import { CreateTableCommand, DescribeTableCommand, DynamoDBClient, ResourceNotFoundException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  AuthCodeStore,
  AuthCodeStoreInput,
} from "../interfaces/auth-code-store-interface.ts";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.DYNAMO_ENDPOINT && {
    endpoint: process.env.DYNAMO_ENDPOINT,
  }),
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const tableName = `${process.env.ENVIRONMENT}-AuthStub-AuthCode`;

export const warmUp = async (): Promise<void> => {
  try {
    await dynamoClient.send(new DescribeTableCommand({
      TableName: tableName,
    }));
  } catch (err) {
    if (err instanceof ResourceNotFoundException && process.env.ENVIRONMENT === 'local') {
      await dynamoClient.send(new CreateTableCommand({
        TableName: tableName,
        KeySchema: [{
          AttributeName: "authCode",
          KeyType: "HASH",
        }],
        AttributeDefinitions: [{
          AttributeName: "authCode",
          AttributeType: "S",
        }],
        BillingMode: "PAY_PER_REQUEST",
      }));
    }
  }
};

export const getAuthCodeStore = async (
  authCode: string
): Promise<AuthCodeStore> => {
  const response = await dynamo.get({
    TableName: tableName,
    Key: { authCode: authCode },
  });
  return response.Item as AuthCodeStore;
};

export const addAuthCodeStore = async (authCodeStore: AuthCodeStoreInput) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      authCode: authCodeStore.authCode,
      subjectId: authCodeStore.subjectId,
      claims: authCodeStore.claims,
      sectorIdentifier: authCodeStore.sectorIdentifier,
      isNewAccount: authCodeStore.isNewAccount,
      passwordResetTime: authCodeStore.passwordResetTime,
      ttl: fiveMintuesFromNow(),
      hasBeenUsed: authCodeStore.hasBeenUsed,
      journeyId: authCodeStore.journeyId,
    },
  });
};

export const updateHasBeenUsedAuthCodeStore = async (
  authCode: string,
  hasBeenUsed: boolean
) => {
  return await dynamo.update({
    TableName: tableName,
    Key: { authCode: authCode },
    UpdateExpression: "SET hasBeenUsed = :hasBeenUsed",
    ExpressionAttributeValues: {
      ":hasBeenUsed": hasBeenUsed,
    },
  });
};

function fiveMintuesFromNow() {
  return Math.floor(Date.now() / 1000) + 300;
}
