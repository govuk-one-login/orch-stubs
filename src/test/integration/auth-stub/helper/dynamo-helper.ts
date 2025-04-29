import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  endpoint: process.env.LOCALSTACK_ENDPOINT!,
});

const getAuthCodeStoreTableName = `${process.env.ENVIRONMENT ?? "local"}-AuthStub-AuthCode`;

const dynamoDoc = DynamoDBDocument.from(dynamoClient);

export async function resetAuthCodeStoreTable() {
  const result = await dynamoDoc.scan({
    TableName: getAuthCodeStoreTableName,
    ConsistentRead: true,
  });

  if (result.Items) {
    for (const item of result.Items) {
      await dynamoDoc.delete({
        TableName: getAuthCodeStoreTableName,
        Key: {
          UserIdentityId: item.UserIdentityId,
        },
      });
    }
  }
}

export async function putAuthCodeStore(
  userIdentityId: string,
  authCodeStore: object
): Promise<void> {
  const authCodeStoreEntry = {
    UserIdentityId: userIdentityId,
    userIdentity: authCodeStore,
    ttl: Math.floor(Date.now() / 1000) + 3600,
  };
  await dynamoDoc.put({
    TableName: getAuthCodeStoreTableName,
    Item: authCodeStoreEntry,
  });
}

export async function getAuthCodeStore(
  userIdentityId: string
): Promise<Record<string, unknown>> {
  const result = await dynamoDoc.get({
    TableName: getAuthCodeStoreTableName,
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
    TableName: getAuthCodeStoreTableName,
    Key: { UserIdentityId: `${userIdentityId}-state` },
    ConsistentRead: true,
  });

  const { state } = result.Item as { state: string };

  return state;
}
