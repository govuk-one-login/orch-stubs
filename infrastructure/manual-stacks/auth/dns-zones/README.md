# Manual stacks - DNS
## Intro

The SAM template creates a DNS record and certificate for `authstub.oidc.<environment>.account.gov.uk` (or `authstub.oidc.account.gov.uk` if environment is `production`).
Note that the `dev` environment gets mapped to `authdev3`. 

This Stack is deployed manually once per environment as part of the DNS set up process. 


## Deployment

Login into AWS with SSO on the browser. Choose an account, and select `Command line or programmatic access`. In your
terminal, run `aws configure sso` and enter the start URL and region from AWS on your browser. This will create a
profile that you can set as an environment variable, by running `export AWS_PROFILE=<profile>`. Then run `aws sso login`
to login into that profile to use.

**_NOTE:_** Make sure the link-hosted-zone stack is deployed otherwwise this stack will fail to create the certificate.

After this you can then run the below, replacing `<environment>`with one
of `dev`, `build`, `staging`, `integration`, `production`:

```shell
./deploy_dns_zone.sh <environment>
```