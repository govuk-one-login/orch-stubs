# Manual stacks - DNS
## Intro

The SAM template creates a Record and certificate for `ipvStub.oidc.account.gov.uk`
or `ipvStub.oidc.<environment>.account.gov.uk` if environment is not `production`.
Where in the case of the `dev` environment it gets mapped to `sandpit`. 

This Stack is deployed manually once per environment
as part of the DNS set up process. 


## Deployment

Login into AWS with SSO on the browser. Choose an account, and select `Command line or programmatic access`. In your
terminal, run `aws configure sso` and enter the start URL and region from AWS on your browser. This will create a
profile that you can set as an environment variable, by running `export AWS_PROFILE=<profile>`.

After this you can then run the below, replacing `<environment>`with one
of `dev`, `build`, `staging`, `integration`, `production`:

```shell
./deploy_dns_zone.sh <environment>
```