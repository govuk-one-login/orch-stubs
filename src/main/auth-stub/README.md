### Testing with the RP stub

Setup to configure the RP stub to use the Auth stub:

Deploy [this branch](https://github.com/govuk-one-login/authentication-api/tree/refs/heads/ATO-1550/point-rp-stub-authdev3-to-auth-stub) to orch dev. This branch changes the Orch Auth Key to the Auth Stub Key and also points the `Auth URLs` to the Auth stub.

This will allow you to test the Orch Auth stub with an Auth journey executed from the sandpit RP stub.
