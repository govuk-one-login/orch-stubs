import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

import { UserIdentity } from "../types";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocument.from(client);

const tableName = `${process.env.ENVIRONMENT}-UserIdentity`;

export const getUserIdentityWithAuthCode = async (
  authCode: string
): Promise<UserIdentity> => {
  const userIdentity = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: authCode },
  });
  return userIdentity as unknown as UserIdentity;
};

export const putUserIdentityWithAuthCode = async (
  authCode: string,
  userIdentity: UserIdentity
) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      UserIdentityId: authCode,
      userIdentity,
    },
  });
};

export const deleteUserIdentityWithAuthCode = async (authCode: string) => {
  return await dynamo.delete({
    TableName: tableName,
    Key: { UserIdentityId: authCode },
  });
};

export const getUserIdentityWithToken = async (
  token: string
): Promise<UserIdentity> => {
  const userIdentity = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: token },
  });
  return userIdentity as unknown as UserIdentity;
};

export const putUserIdentityWithToken = async (
  token: string,
  userIdentity: UserIdentity
) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      UserIdentityId: token,
      userIdentity,
    },
  });
};

export const deleteUserIdentityWithToken = async (
  token: string
): Promise<UserIdentity> => {
  const userIdentity = await dynamo.get({
    TableName: tableName,
    Key: { UserIdentityId: token },
  });
  return userIdentity as unknown as UserIdentity;
};
