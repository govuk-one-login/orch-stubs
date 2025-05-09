#!/usr/bin/env bash

awslocal dynamodb create-table --table-name local-IpvStub-UserIdentity --key-schema AttributeName=UserIdentityId,KeyType=HASH --attribute-definitions AttributeName=UserIdentityId,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-AuthCode --key-schema AttributeName=authCode,KeyType=HASH --attribute-definitions AttributeName=authCode,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2
awslocal dynamodb create-table --table-name local-AuthStub-AccessToken --key-schema AttributeName=accessToken,KeyType=HASH --attribute-definitions AttributeName=accessToken,AttributeType=S --billing-mode PAY_PER_REQUEST --region eu-west-2