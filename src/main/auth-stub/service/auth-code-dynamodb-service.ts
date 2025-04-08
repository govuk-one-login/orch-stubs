import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import {
  AuthCodeStore,
  AuthCodeStoreInput,
} from "../interfaces/auth-code-store-interface";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.LOCALSTACK_ENDPOINT && {
    endpoint: process.env.LOCALSTACK_ENDPOINT,
  }),
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const tableName = `${process.env.ENVIRONMENT}AuthStubAuthCode`;

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
