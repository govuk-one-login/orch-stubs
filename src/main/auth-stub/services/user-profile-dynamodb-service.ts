import {
  BillingMode,
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ProjectionType,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { UserProfile } from "../interfaces/user-profile-interface.ts";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: "eu-west-2",
  ...(process.env.DYNAMO_ENDPOINT && {
    endpoint: process.env.DYNAMO_ENDPOINT,
  }),
});
const dynamo = DynamoDBDocument.from(dynamoClient);

const tableName = `${process.env.ENVIRONMENT}-AuthStub-UserProfile`;

export const warmUp = async () => {
  if (process.env.ENVIRONMENT === "local") {
    try {
      await dynamoClient.send(
        new DescribeTableCommand({
          TableName: tableName,
        })
      );
    } catch (err) {
      console.error(err);
      if (err instanceof ResourceNotFoundException) {
        await dynamoClient.send(
          new CreateTableCommand({
            TableName: tableName,
            BillingMode: BillingMode.PAY_PER_REQUEST,
            AttributeDefinitions: [
              { AttributeName: "email", AttributeType: "S" },
              { AttributeName: "subjectId", AttributeType: "S" },
            ],
            KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
            GlobalSecondaryIndexes: [
              {
                IndexName: "SubjectIdIndex",
                KeySchema: [{ AttributeName: "subjectId", KeyType: "HASH" }],
                Projection: { ProjectionType: ProjectionType.ALL },
              },
            ],
          })
        );
      } else {
        throw err;
      }
    }
  }
};

export const getUserProfileByEmail = async (
  email: string
): Promise<UserProfile> => {
  const response = await dynamo.get({
    TableName: tableName,
    Key: { email: email },
  });
  return response.Item as UserProfile;
};

export const getUserProfileBySubjectId = async (
  subjectId: string
): Promise<UserProfile> => {
  const response = await dynamo.query({
    TableName: tableName,
    IndexName: "SubjectIdIndex",
    KeyConditionExpression: "subjectId = :subjectId",
    ExpressionAttributeValues: {
      ":subjectId": subjectId,
    },
  });
  return response.Items![0] as UserProfile;
};

export const addUserProfile = async (userProfile: UserProfile) => {
  return await dynamo.put({
    TableName: tableName,
    Item: {
      subjectId: userProfile.subjectId,
      email: userProfile.email,
      emailVerified: userProfile.emailVerified,
      phoneNumber: userProfile.phoneNumber,
      phoneNumberVerified: userProfile.phoneNumberVerified,
      created: userProfile.created,
      updated: userProfile,
      termsAndConditions: userProfile.termsAndConditions,
      publicSubjectId: userProfile.publicSubjectId,
      legacySubjectId: userProfile.legacySubjectId,
      salt: userProfile.salt,
      accountVerified: userProfile.accountVerified,
      testUser: userProfile.testUser,
    },
  });
};
