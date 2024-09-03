# Manual stacks - Link Hosted Zone
## Intro

The SAM template is used to creates an NS Record on the root domain account for the sub domains that live
in the orchestration account.

This Stack is deployed manually once per environment as part of the DNS set up process. The hosted zone and subdomain
should be created first (this is done in the pipeline) in the orchestraion account and then the associated NS record values copied
into this template to deploy into the root domain account.

### Root Domain accounts

 - Production  = `gds-di-production`
 - Integration = `gds-di-development`
 - Staging     = `di-auth-staging`
 - Build       = `gds-di-development`
 - Dev         = `gds-di-development`

## Deployment

Login into AWS with SSO on the browser. Choose an account, and select `Command line or programmatic access`. In your
terminal, run `aws configure sso` and enter the start URL and region from AWS on your browser. This will create a
profile that you can set as an environment variable, by running `export AWS_PROFILE=<profile>`.

**_NOTE:_** Make sure the hosted zone is created in the orchestration account first and then the NS values copied over to the right root account

After this you can then run the below, replacing `<environment>`with one
of `dev`, `build`, `staging`, `integration`, `production`:

```shell
./deploy_link_hosted_zone.sh <environment>
```