import { createApiGatewayEvent } from "../util.ts";
import { handler } from "../../../main/auth-stub/auth-userinfo.ts";
import {
  addUserProfile,
  deleteAccessToken,
  deleteUserProfile,
  getAccessTokenStore,
} from "./helpers/dynamo-helper.ts";
import {
  addAccessTokenStore,
  addCustomAccessTokenStore,
} from "../../../main/auth-stub/test-helper/test-access-token-dynamodb-service.ts";
import {
  AccessTokenStoreOptions,
  createAccessTokenStoreInput,
  createCustomAccessTokenStore,
  createUserPofile,
} from "../../../main/auth-stub/test-helper/mock-token-data-helper.ts";
import { UserProfile } from "../../../main/auth-stub/interfaces/user-profile-interface.ts";
import { UserInfoClaims } from "src/main/auth-stub/interfaces/user-info-claim-interface.ts";

describe("Auth User Info", () => {
  const EMAIL = "dummy_user_info@mail.com";
  const SUBJECT_ID = "authUserInfoSubjectId";
  const ACCESS_TOKEN = "123456";

  let userProfileMock: UserProfile;

  beforeEach(async () => {
    userProfileMock = createUserPofile(EMAIL, SUBJECT_ID);
    await setUpAccessToken();
    await addUserProfile(userProfileMock);
  });

  afterEach(async () => {
    await deleteAccessToken(ACCESS_TOKEN);
    await deleteUserProfile(userProfileMock);
  });

  it("should return 200 for valid GET request and update Dynamo", async () => {
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(200);

    const authUserInfoResponse: UserInfoClaims = JSON.parse(response.body);

    expect(authUserInfoResponse.email).toBe(userProfileMock.email);
    expect(authUserInfoResponse.local_account_id).toBe(
      userProfileMock.subjectId
    );

    const accessTokenStore = await getAccessTokenStore(ACCESS_TOKEN);

    expect(accessTokenStore.hasBeenUsed).toBe(true);
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
          Authorization: "Bearer",
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Unable to extract (opaque) bearer token: Invalid HTTP Authorization header value"`,
    ]);
  });

  it("should return a 401 error when access token has been used", async () => {
    const USED_ACCESS_TOKEN = "888888";
    await setUpCustomAccessToken({
      accessToken: USED_ACCESS_TOKEN,
      hasBeenUsed: true,
    });

    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `Bearer ${USED_ACCESS_TOKEN}`,
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Invalid bearer token"`,
    ]);

    await deleteAccessToken(USED_ACCESS_TOKEN);
  });

  it("should return a 401 error when access token has expired", async () => {
    const EXPIRED_ACCESS_TOKEN = "999999";
    await setUpCustomAccessToken({
      accessToken: EXPIRED_ACCESS_TOKEN,
      ttl: Math.floor(Date.now() / 1000) - 180,
    });

    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `Bearer ${EXPIRED_ACCESS_TOKEN}`,
        }
      ),
      null!,
      null!
    );

    expect(response.statusCode).toBe(401);
    expect(response.multiValueHeaders["WWW-Authenticate"]).toStrictEqual([
      `Bearer error="invalid_token", error_description="Error: Invalid bearer token"`,
    ]);

    await deleteAccessToken(EXPIRED_ACCESS_TOKEN);
  });

  it("should return a 401 error when access token dynamo errors", async () => {
    const INVALID_ACCESS_TOKEN = "invalid-access-token";
    const response = await handler(
      createApiGatewayEvent(
        "GET",
        "",
        {},
        {
          "Content-Type": "x-www-form-urlencoded",
          Authorization: `Bearer ${INVALID_ACCESS_TOKEN}`,
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
