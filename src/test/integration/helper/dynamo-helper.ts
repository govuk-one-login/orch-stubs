import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  endpoint: process.env.DYNAMO_ENDPOINT!,
});

const getUserIdentityTableName = (identityStubName: string) =>
  `${process.env.ENVIRONMENT ?? "local"}-${identityStubName}-UserIdentity`;

const dynamoDoc = DynamoDBDocument.from(dynamoClient);

export async function resetUserIdentityTable(identityStubName: string) {
  console.log("Table: ", getUserIdentityTableName(identityStubName));
  const result = await dynamoDoc.scan({
    TableName: getUserIdentityTableName(identityStubName),
    ConsistentRead: true,
  });

  if (result.Items) {
    for (const item of result.Items) {
      await dynamoDoc.delete({
        TableName: getUserIdentityTableName(identityStubName),
        Key: {
          UserIdentityId: item.UserIdentityId,
        },
      });
    }
  }
}

export async function putUserIdentity(
  identityStubName: string,
  userIdentityId: string,
  userIdentity: object
): Promise<void> {
  const userIdentityEntry = {
    UserIdentityId: userIdentityId,
    userIdentity: userIdentity,
    ttl: Math.floor(Date.now() / 1000) + 3600,
  };
  await dynamoDoc.put({
    TableName: getUserIdentityTableName(identityStubName),
    Item: userIdentityEntry,
  });
}

export async function getUserIdentity(
  identityStubName: string,
  userIdentityId: string
): Promise<Record<string, unknown>> {
  const result = await dynamoDoc.get({
    TableName: getUserIdentityTableName(identityStubName),
    Key: { UserIdentityId: userIdentityId },
    ConsistentRead: true,
  });

  const { userIdentity } = result.Item as Record<
    string,
    Record<string, unknown>
  >;

  return userIdentity;
}

export async function getState(
  identityStubName: string,
  userIdentityId: string
): Promise<string> {
  const result = await dynamoDoc.get({
    TableName: getUserIdentityTableName(identityStubName),
    Key: { UserIdentityId: `${userIdentityId}-state` },
    ConsistentRead: true,
  });

  const { state } = result.Item as { state: string };

  return state;
}
