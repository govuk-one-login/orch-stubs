import { createApiGatewayEvent } from "../util";
import { handler } from "../../../main/auth-stub/auth-userinfo";
import {
  addUserProfile,
  getAccessTokenStore,
  resetAccessTokenStore,
  resetUserProfile,
} from "./helpers/dynamo-helper";
import {
  addAccessTokenStore,
  addCustomAccessTokenStore,
} from "../../../main/auth-stub/test-helper/test-access-token-dynamodb-service";
import {
  AccessTokenStoreOptions,
  createAccessTokenStoreInput,
  createCustomAccessTokenStore,
  createUserPofile,
} from "../../../main/auth-stub/test-helper/mock-token-data-helper";
import { UserProfile } from "../../../main/auth-stub/interfaces/user-profile-interface";
import { UserInfoClaims } from "src/main/auth-stub/interfaces/user-info-claim-interface";

describe("Auth User Info", () => {
  const EMAIL = "dummy_user_info@mail.com";
  const SUBJECT_ID = "authUserInfoSubjectId";
  const ACCESS_TOKEN = "12345";

  let userProfileMock: UserProfile;

  beforeEach(async () => {
    userProfileMock = createUserPofile(EMAIL, SUBJECT_ID);
    await setUpAccessToken();
    await addUserProfile(userProfileMock);
  });

  afterEach(async () => {
    await resetAccessTokenStore();
    await resetUserProfile();
  });

  it("should return 200 for valid GET request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `bearer ${ACCESS_TOKEN}`,
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(200);
    const authUserInfoResponse: UserInfoClaims = JSON.parse(response.body);
    expect(authUserInfoResponse.claims.email).toBe(userProfileMock.email);
    expect(authUserInfoResponse.claims.local_account_id).toBe(
      userProfileMock.subjectId
    );
    const accessTokenStore = await getAccessTokenStore(ACCESS_TOKEN);
    expect(accessTokenStore.hasBeenUsed).toBeTruthy();
  });

  it("should return a 401 error when headers is not given", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      "Bearer",
    ]);
  });

  it("should return a 401 error when getAccessTokenFromAuthorizationHeader fails", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: "bearer",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Unable to extract (opaque) bearer token"`,
    ]);
  });

  it("should return a 401 error when access token has been used", async () => {
    await resetAccessTokenStore();
    await setUpCustomAccessToken({
      accessToken: ACCESS_TOKEN,
      hasBeenUsed: true,
    });

    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `bearer ${ACCESS_TOKEN}`,
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Invalid bearer token"`,
    ]);
  });

  it("should return a 401 error when access token has expired", async () => {
    await resetAccessTokenStore();
    await setUpCustomAccessToken({
      accessToken: ACCESS_TOKEN,
      ttl: Math.floor(Date.now() / 1000) - 180,
    });

    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `bearer ${ACCESS_TOKEN}`,
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Invalid bearer token"`,
    ]);
  });

  it("should return a 401 error when access token dynamo errors", async () => {
    await resetAccessTokenStore();

    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `bearer ${ACCESS_TOKEN}`,
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="TypeError: Cannot read properties of undefined (reading 'hasBeenUsed')"`,
    ]);
  });

  async function setUpAccessToken(): Promise<void> {
    await addAccessTokenStore(
      createAccessTokenStoreInput(ACCESS_TOKEN, SUBJECT_ID)
    );
  }

  async function setUpCustomAccessToken(
    accessTokenStoreOptions: AccessTokenStoreOptions
  ): Promise<void> {
    await addCustomAccessTokenStore(
      createCustomAccessTokenStore(accessTokenStoreOptions)
    );
  }
});
