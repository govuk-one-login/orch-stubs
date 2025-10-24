### Testing with the RP stub

Setup to configure the RP stub to use the Auth stub:

- In the authentication-api repo, there is an `authStubEnabled` flag in the dev environment configuration. It's defaulted to `false`, but you can create a branch to toggle it to `true`, (or you can use [this branch](https://github.com/govuk-one-login/authentication-api/tree/refs/heads/ATO-1550/enable-auth-stub-in-dev)).

The `authStubEnabled` feature flag updates the URLs and encryption keys in orch to use the stub ones instead of the real auth ones.

This will allow you to test the Orch Auth stub with an Auth journey executed from the authdev3 RP stub.
