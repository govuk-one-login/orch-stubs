#!/usr/bin/env bash

awslocal dynamodb create-table --table-name local-IpvStub-UserIdentity --key-schema AttributeName=UserIdentityId,KeyType=HASH --attribute-definitions AttributeName=UserIdentityId,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name localAuthStubAuthCode --key-schema AttributeName=AuthCode,KeyType=HASH --attribute-definitions AttributeName=AuthCode,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name localAuthStubToken --key-schema AttributeName=Token,KeyType=HASH --attribute-definitions AttributeName=Token,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2