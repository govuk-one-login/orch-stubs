import {
  addAuthCodeStore,
  getAuthCodeStore,
  updateHasBeenUsedAuthCodeStore,
} from "./auth-code-dynamodb-service";
import {
  createAuthCodeStore,
  createAuthCodeStoreInput,
} from "../test-helper/mock-auth-code-data-helper";

const TEST_AUTH_CODE = "testAuthCode";

jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocument: {
      from: jest.fn().mockImplementation(() => {
        return {
          get: jest.fn(() =>
            Promise.resolve({ Item: createAuthCodeStore(TEST_AUTH_CODE) })
          ),
          put: jest.fn(() => Promise.resolve("SUCCESS")),
          update: jest.fn(() => Promise.resolve("SUCCESS")),
        };
      }),
    },
  };
});

describe("Auth Code DynamoDb Service", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it("should return an auth-code-store object when given an auth-code to get auth-code-store", async () => {
    const authCodeStore = await getAuthCodeStore(TEST_AUTH_CODE);

    expect(authCodeStore).toEqual(createAuthCodeStore(TEST_AUTH_CODE));
  });

  it("should return a success response when given an auth-code-store object to add to the auth-code-store", async () => {
    const response = await addAuthCodeStore(
      createAuthCodeStoreInput(TEST_AUTH_CODE)
    );

    expect(response).toBe("SUCCESS");
  });

  it("should return a success response when given an auth-code and boolean to update the auth-code-store", async () => {
    const response = await updateHasBeenUsedAuthCodeStore(TEST_AUTH_CODE, true);

    expect(response).toBe("SUCCESS");
  });
});
