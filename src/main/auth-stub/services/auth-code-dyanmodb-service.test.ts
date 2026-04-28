import {
  addAuthCodeStore,
  getAuthCodeStore,
  updateHasBeenUsedAuthCodeStore,
} from "./auth-code-dynamodb-service.ts";
import {
  createAuthCodeStore,
  createAuthCodeStoreInput,
} from "../test-helper/mock-auth-code-data-helper.ts";

const TEST_AUTH_CODE = "testAuthCode";

vi.mock("@aws-sdk/lib-dynamodb", () => {
  return {
    DynamoDBDocument: {
      from: vi.fn().mockImplementation(() => {
        return {
          get: vi.fn(() =>
            Promise.resolve({ Item: createAuthCodeStore(TEST_AUTH_CODE) })
          ),
          put: vi.fn(() => Promise.resolve("SUCCESS")),
          update: vi.fn(() => Promise.resolve("SUCCESS")),
        };
      }),
    },
  };
});

describe("Auth Code DynamoDb Service", () => {
  afterAll(() => {
    vi.clearAllMocks();
  });

  it("should return an auth-code-store object when given an auth-code to get auth-code-store", async () => {
    const authCodeStore = await getAuthCodeStore(TEST_AUTH_CODE);

    expect(authCodeStore).toStrictEqual(createAuthCodeStore(TEST_AUTH_CODE));
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
