import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { AuthCodeStore } from "../interfaces/auth-code-store-interface";

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
    Key: { AuthCode: authCode },
  });
  return response.Item as AuthCodeStore;
};

export const addAuthCodeStore = async (authCodeStore: AuthCodeStore) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      AuthCode: authCodeStore.authCode,
      SubjectId: authCodeStore.subjectId,
      Claims: authCodeStore.claims,
      SectorIdentifier: authCodeStore.sectorIdentifier,
      IsNewAccount: authCodeStore.isNewAccount,
      PasswordResetTime: authCodeStore.passwordResetTime,
      Ttl: fiveMintuesFromNow(),
      HasBeenUsed: authCodeStore.hasBeenUsed,
    },
  });
};

export const updateHasBeenUsedAuthCodeStore = async (
  authCode: string,
  hasBeenUsed: boolean
) => {
  return await dynamo.update({
    TableName: tableName,
    Key: { AuthCode: authCode },
    UpdateExpression: "SET HasBeenUsed = :HasBeenUsed",
    ExpressionAttributeValues: {
      ":HasBeenUsed": hasBeenUsed,
    },
  });
};

function fiveMintuesFromNow() {
  return Math.floor(Date.now() / 1000) + 300;
}
