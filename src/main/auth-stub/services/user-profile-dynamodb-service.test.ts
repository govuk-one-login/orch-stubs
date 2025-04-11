import { DUMMY_EMAIL, getUserProfile } from "./user-profile-dynamodb-service";

it("should return the dummy UserProfile if the right email is given", async () => {
  const userProfile = await getUserProfile(DUMMY_EMAIL);
  expect(userProfile.Email).toBe(DUMMY_EMAIL);
  expect(userProfile.SubjectID).toBe("dummy-subject-id");
});

it("should fail if an invalid email is given", async () => {
  await expect(getUserProfile("invalid.email@mail.com")).rejects.toThrow(
    new Error("invalid email")
  );
});
