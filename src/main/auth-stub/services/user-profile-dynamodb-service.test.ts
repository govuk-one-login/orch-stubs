import {
  DUMMY_EMAIL,
  DUMMY_SUBJECT_ID,
  getUserProfileByEmail,
  getUserProfileBySubjectId,
} from "./user-profile-dynamodb-service";

it("should return the dummy UserProfile if the right email is given", async () => {
  const userProfile = await getUserProfileByEmail(DUMMY_EMAIL);

  expect(userProfile.Email).toBe(DUMMY_EMAIL);
  expect(userProfile.SubjectID).toBe(DUMMY_SUBJECT_ID);
});

it("should fail if an invalid email is given", async () => {
  const action = async () =>
    await getUserProfileByEmail("invalid.email@mail.com");

  await expect(action).rejects.toThrow(new Error("invalid email"));
});

it("should return the dummy UserProfile if the right subject ID is given", async () => {
  const userProfile = await getUserProfileBySubjectId(DUMMY_SUBJECT_ID);

  expect(userProfile.SubjectID).toBe(DUMMY_SUBJECT_ID);
  expect(userProfile.Email).toBe(DUMMY_EMAIL);
});

it("should fail if an invalid subject ID is given", async () => {
  const action = async () =>
    await getUserProfileBySubjectId("invalid-subject-id");

  await expect(action).rejects.toThrow(new Error("invalid subject ID"));
});
