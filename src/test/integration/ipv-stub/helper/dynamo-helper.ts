import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  endpoint: process.env.LOCALSTACK_ENDPOINT!,
});

const getUserIdentityTableName = `${process.env.ENVIRONMENT ?? "local"}-IpvStub-UserIdentity`;

const dynamoDoc = DynamoDBDocument.from(dynamoClient);

export async function resetUserIdentityTable() {
  const result = await dynamoDoc.scan({
    TableName: getUserIdentityTableName,
    ConsistentRead: true,
  });

  if (result.Items) {
    for (const item of result.Items) {
      await dynamoDoc.delete({
        TableName: getUserIdentityTableName,
        Key: {
          UserIdentityId: item.UserIdentityId,
        },
      });
    }
  }
}

export async function putUserIdentity(
  userIdentityId: string,
  userIdentity: object
): Promise<void> {
  const userIdentityEntry = {
    UserIdentityId: userIdentityId,
    userIdentity: userIdentity,
    ttl: Math.floor(Date.now() / 1000) + 3600,
  };
  await dynamoDoc.put({
    TableName: getUserIdentityTableName,
    Item: userIdentityEntry,
  });
}

export async function getUserIdentity(
  userIdentityId: string
): Promise<Record<string, unknown>> {
  const result = await dynamoDoc.get({
    TableName: getUserIdentityTableName,
    Key: { UserIdentityId: userIdentityId },
    ConsistentRead: true,
  });

  const { userIdentity } = result.Item as Record<
    string,
    Record<string, unknown>
  >;

  return userIdentity;
}

export async function getState(userIdentityId: string): Promise<string> {
  const result = await dynamoDoc.get({
    TableName: getUserIdentityTableName,
    Key: { UserIdentityId: `${userIdentityId}-state` },
    ConsistentRead: true,
  });

  const { state } = result.Item as { state: string };

  return state;
}
