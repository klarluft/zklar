# zKlar service

Following this tutorial:
https://medium.com/@thomas.cogez/create-a-basic-graphql-crud-api-with-mongodb-typegraphql-type-orm-and-typescript-decorators-272aa28b00a5

**Start/stop local mongo db**

```bash
docker-compose up -d
docker-compose stop
```

**Start development server**

```bash
yarn dev
```

**Run unit tests**

```bash
yarn build
yarn test:unit
```

TODO:

- some filtering for commitments
- pagination
- setting up local setup with blockchain running
- getting deposits from blockchain and adding those commitments
- separate service processing commitments
- more types of transactions (1-2, 2-1, 1-3, 3-1...)
- rolling up
- send transaction to blockchain
- deployment to test network
- schema file
- dino setup
- documentation
- figure out how to make it more decentralized
- what if service stops working - how to retrieve funds?
