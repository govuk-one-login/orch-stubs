import { createUserProfile } from "../test-helper/mock-user-profile-data-helper";
import {
  getUserProfileByEmail,
  getUserProfileBySubjectId,
} from "./user-profile-dynamodb-service";

const EMAIL = "testEmail@gov.uk";
const SUBJECT_ID = "testSubjectId";

jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocument: {
      from: jest.fn().mockImplementation(() => {
        return {
          get: jest.fn(() =>
            Promise.resolve({ Item: createUserProfile(EMAIL, SUBJECT_ID) })
          ),
          query: jest.fn(() =>
            Promise.resolve({ Items: [createUserProfile(EMAIL, SUBJECT_ID)] })
          ),
        };
      }),
    },
  };
});

describe("User Profile DynamoDb Service", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it("should return the dummy UserProfile if the right email is given", async () => {
    const userProfile = await getUserProfileByEmail(EMAIL);

    expect(userProfile.email).toBe(EMAIL);
    expect(userProfile.subjectId).toBe(SUBJECT_ID);
  });

  it("should return the dummy UserProfile if the right subject ID is given", async () => {
    const userProfile = await getUserProfileBySubjectId(SUBJECT_ID);

    expect(userProfile.subjectId).toBe(SUBJECT_ID);
    expect(userProfile.email).toBe(EMAIL);
  });
});
