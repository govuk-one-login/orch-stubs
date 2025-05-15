import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { AccessTokenStore } from "src/main/auth-stub/interfaces/access-token-store-interface";
import {
  AuthCodeStore,
  AuthCodeStoreInput,
} from "src/main/auth-stub/interfaces/auth-code-store-interface";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  endpoint: process.env.LOCALSTACK_ENDPOINT!,
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const authCodeTableName = `${process.env.ENVIRONMENT ?? "local"}-AuthStub-AuthCode`;
const accessTokenTableName = `${process.env.ENVIRONMENT ?? "local"}-AuthStub-AccessToken`;

export async function resetAuthCodeStore() {
  const result = await dynamo.scan({
    TableName: authCodeTableName,
    ConsistentRead: true,
  });

  if (result.Items) {
    for (const item of result.Items) {
      await dynamo.delete({
        TableName: authCodeTableName,
        Key: {
          authCode: item.authCode,
        },
      });
    }
  }
}

export async function resetAccessTokenStore() {
  const result = await dynamo.scan({
    TableName: accessTokenTableName,
    ConsistentRead: true,
  });

  if (result.Items) {
    for (const item of result.Items) {
      await dynamo.delete({
        TableName: accessTokenTableName,
        Key: {
          accessToken: item.accessToken,
        },
      });
    }
  }
}

export async function getAuthCodeStore(
  authCode: string
): Promise<AuthCodeStore> {
  const response = await dynamo.get({
    TableName: authCodeTableName,
    Key: { authCode: authCode },
    ConsistentRead: true,
  });

  return response.Item as AuthCodeStore;
}

export async function getAccessTokenStore(
  accessToken: string
): Promise<AccessTokenStore> {
  const response = await dynamo.get({
    TableName: accessTokenTableName,
    Key: { accessToken: accessToken },
    ConsistentRead: true,
  });

  return response.Item as AccessTokenStore;
}

export const addAuthCodeStore = async (authCodeStore: AuthCodeStoreInput) => {
  return await dynamo.put({
    TableName: authCodeTableName,
    Item: {
      authCode: authCodeStore.authCode,
      subjectId: authCodeStore.subjectId,
      claims: authCodeStore.claims,
      sectorIdentifier: authCodeStore.sectorIdentifier,
      isNewAccount: authCodeStore.isNewAccount,
      passwordResetTime: authCodeStore.passwordResetTime,
      ttl: oneHourFromNow(),
      hasBeenUsed: authCodeStore.hasBeenUsed,
    },
  });
};

function oneHourFromNow() {
  return Math.floor(Date.now() / 1000) + 3600;
}
