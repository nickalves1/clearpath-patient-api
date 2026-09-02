# Clearpath Patient API

Backend service for Clearpath's patient-facing app, built with [NestJS](https://nestjs.com) as a hands-on exercise in Node/AWS/Terraform architecture and best practices — separate from the main [Clearpath](https://github.com/nickalves1/clearpath) PHP/Laravel + React monorepo.

## About this project

This is an early-stage backend built to practice production-grade patterns before applying them to Clearpath's own roadmap: NestJS with dependency injection, hexagonal (ports & adapters) architecture, request validation, and — next — infrastructure as code with Terraform on AWS (DynamoDB, SQS, SNS, S3, SSM Parameter Store).

The first vertical slice implements **release requests** (a patient requesting their medical records be released to one or more hospitals), structured as:

```
src/release-requests/
├── domain/                        # framework-agnostic types (the business model)
├── repositories/                  # abstract port + in-memory adapter (swappable via DI)
├── dto/                           # HTTP input validation (class-validator)
├── release-requests.service.ts    # business logic, depends only on the abstract repository
├── release-requests.controller.ts # HTTP layer (POST / GET)
└── release-requests.module.ts     # wiring: binds the abstract repository to a concrete adapter
```

The repository is bound via Nest's DI container (`{ provide: ReleaseRequestsRepository, useClass: InMemoryReleaseRequestsRepository }`), so the in-memory adapter used today can be swapped for a real DynamoDB-backed one later without touching the service or controller — see `release-requests.service.spec.ts` for a test that proves the swap.

## Project setup

```bash
npm install
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Run tests

```bash
# unit tests
npm test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Roadmap

- [x] Release requests: domain, repository port + in-memory adapter, service, DTO validation, controller, module, DI-swap test
- [ ] Terraform: provision DynamoDB, SQS + DLQ, SNS, S3, IAM, SSM Parameter Store
- [ ] Real DynamoDB repository adapter with idempotency via conditional writes
- [ ] Async worker: package release → S3 → SNS notification, with retry → DLQ
