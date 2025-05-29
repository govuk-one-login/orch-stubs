import {
  addAccessTokenStore,
  getAccessTokenStore,
  updateHasBeenUsedAccessTokenStore,
} from "./access-token-dynamodb-service";
import {
  createAccessTokenStoreInput,
  createAccessTokenStore,
} from "../test-helper/mock-token-data-helper";

const TEST_ACCESS_TOKEN = "testAccessToken";

jest.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocument: {
      from: jest.fn().mockImplementation(() => {
        return {
          get: jest.fn(() =>
            Promise.resolve({ Item: createAccessTokenStore(TEST_ACCESS_TOKEN) })
          ),
          put: jest.fn(() => Promise.resolve("SUCCESS")),
          update: jest.fn(() => Promise.resolve("SUCCESS")),
        };
      }),
    },
  };
});

describe("Access Token DynamoDb Service", () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  it("should return an access-token-store object when given a token to get access-token-store", async () => {
    const accessTokenStore = await getAccessTokenStore(TEST_ACCESS_TOKEN);

    expect(accessTokenStore).toEqual(createAccessTokenStore(TEST_ACCESS_TOKEN));
  });

  it("should return a success response when given an access-token-store object to add to the access-token-store", async () => {
    const response = await addAccessTokenStore(
      createAccessTokenStoreInput(TEST_ACCESS_TOKEN)
    );

    expect(response).toBe("SUCCESS");
  });

  it("should return a success response when given an access-token and boolean to update the access-token-store", async () => {
    const response = await updateHasBeenUsedAccessTokenStore(
      TEST_ACCESS_TOKEN,
      true
    );

    expect(response).toBe("SUCCESS");
  });
});
