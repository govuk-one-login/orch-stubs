import { createApiGatewayEvent } from "../util";
import { handler } from "../../../main/auth-stub/auth-userinfo";
import {
  getAccessTokenStore,
  resetAccessTokenStore,
} from "./helpers/dynamo-helper";
import { addAccessTokenStore } from "../../../main/auth-stub/services/access-token-dynamodb-service";
import { createAccessTokenStoreInput } from "../../../main/auth-stub/test-helper/mock-token-data-helper";
import { UserInfoClaims } from "../../../main/auth-stub/interfaces/user-info-claim-interface";
import {
  DUMMY_EMAIL,
  DUMMY_SUBJECT_ID,
} from "../../../main/auth-stub/services/user-profile-dynamodb-service";

const ACCESS_TOKEN = "12345";

beforeEach(setUpAccessToken);
afterEach(() => {
  resetAccessTokenStore();
});

describe("Auth User Info", () => {
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
    expect(authUserInfoResponse.claims.email).toBe(DUMMY_EMAIL);
    expect(authUserInfoResponse.claims.local_account_id).toBe(DUMMY_SUBJECT_ID);
    const accessTokenStore = await getAccessTokenStore(ACCESS_TOKEN);
    expect(accessTokenStore.hasBeenUsed).toBeTruthy();
  });
});

async function setUpAccessToken(): Promise<void> {
  await addAccessTokenStore(createAccessTokenStoreInput(ACCESS_TOKEN));
}
