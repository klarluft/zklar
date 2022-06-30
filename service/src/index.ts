import 'reflect-metadata';
import http from 'http';

import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';

import { setupPoseidon } from './lib/poseidon';
import { CommitmentResolver } from './resolvers/CommitmentResolver';
import { NullifierResolver } from './resolvers/NullifierResolver';
import { TransactionResolver } from './resolvers/TransactionResolver';

const startServer = async () => {
  await setupPoseidon();

  await createConnection({
    type: 'mongodb',
    url: 'mongodb://root:example@localhost:27017/zklar',
    synchronize: true,
    entities: ['./src/entities/*.ts'],
    authSource: 'admin',
    useUnifiedTopology: true,
  });

  const schema = await buildSchema({
    resolvers: [TransactionResolver, NullifierResolver, CommitmentResolver],
  });

  const app = express();

  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: 4000 }, resolve)
  );

  console.log(
    `🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`
  );
};

startServer();
