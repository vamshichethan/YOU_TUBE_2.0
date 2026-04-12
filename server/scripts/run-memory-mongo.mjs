import { MongoMemoryServer } from "mongodb-memory-server";

const server = await MongoMemoryServer.create({
  instance: {
    port: 27017,
    dbName: "yourtube",
    ip: "127.0.0.1",
  },
});

console.log(`memory-mongo ready at ${server.getUri()}`);

const shutdown = async () => {
  await server.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

setInterval(() => {}, 1 << 30);
