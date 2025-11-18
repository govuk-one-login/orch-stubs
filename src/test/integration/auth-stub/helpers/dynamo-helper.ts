import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { AccessTokenStore } from "src/main/auth-stub/interfaces/access-token-store-interface.ts";
import {
  AuthCodeStore,
  AuthCodeStoreInput,
} from "src/main/auth-stub/interfaces/auth-code-store-interface.ts";
import { UserProfile } from "src/main/auth-stub/interfaces/user-profile-interface.ts";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  endpoint: process.env.LOCALSTACK_ENDPOINT!,
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const authCodeTableName = `${process.env.ENVIRONMENT ?? "local"}-AuthStub-AuthCode`;
const accessTokenTableName = `${process.env.ENVIRONMENT ?? "local"}-AuthStub-AccessToken`;
const userProfileTableName = `${process.env.ENVIRONMENT ?? "local"}-AuthStub-UserProfile`;

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

export async function resetUserProfile() {
  const result = await dynamo.scan({
    TableName: userProfileTableName,
    ConsistentRead: true,
  });

  if (result.Items) {
    for (const item of result.Items) {
      await dynamo.delete({
        TableName: userProfileTableName,
        Key: {
          email: item.email,
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

export const addUserProfile = async (userProfile: UserProfile) => {
  return await dynamo.put({
    TableName: userProfileTableName,
    Item: {
      subjectId: userProfile.subjectId,
      email: userProfile.email,
      emailVerified: userProfile.emailVerified,
      phoneNumber: userProfile.phoneNumber,
      phoneNumberVerified: userProfile.phoneNumberVerified,
      created: userProfile.created,
      updated: userProfile,
      termsAndConditions: userProfile.termsAndConditions,
      publicSubjectID: userProfile.publicSubjectId,
      legacySubjectID: userProfile.legacySubjectId,
      salt: userProfile.salt,
      accountVerified: userProfile.accountVerified,
      testUser: userProfile.testUser,
    },
  });
};

function oneHourFromNow() {
  return Math.floor(Date.now() / 1000) + 3600;
}
