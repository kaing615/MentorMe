import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { io as connectSocket } from "socket.io-client";
import attachSocket from "../../src/socket/index.js";
import { createRedisClients } from "../../src/infrastructure/redis/redis.client.js";
import { signAccessToken } from "../../src/modules/identity/access-token.js";

const redisUrl = process.env.REDIS_TEST_URL;
const jwtAccessSecret = "socket-replica-test-secret-at-least-32-characters";

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}

test(
  "Socket.IO publishes to a user connected through another API replica",
  { skip: !redisUrl },
  async () => {
    const redisA = await createRedisClients(redisUrl);
    const redisB = await createRedisClients(redisUrl);
    const serverA = http.createServer();
    const serverB = http.createServer();
    const ioA = attachSocket(serverA, {
      corsOrigins: ["http://localhost"],
      redisClients: redisA,
      webSocketOnly: true,
      jwtAccessSecret,
    });
    const ioB = attachSocket(serverB, {
      corsOrigins: ["http://localhost"],
      redisClients: redisB,
      webSocketOnly: true,
      jwtAccessSecret,
    });
    await Promise.all([listen(serverA), listen(serverB)]);
    const userA = "507f1f77bcf86cd799439011";
    const userB = "507f191e810c19729de860ea";
    const tokenA = signAccessToken({ id: userA }, { secret: jwtAccessSecret });
    const tokenB = signAccessToken({ id: userB }, { secret: jwtAccessSecret });
    const clientA = connectSocket(`http://127.0.0.1:${serverA.address().port}`, {
      auth: { token: tokenA },
      transports: ["websocket"],
    });
    const clientB = connectSocket(`http://127.0.0.1:${serverB.address().port}`, {
      auth: { token: tokenB },
      transports: ["websocket"],
    });
    try {
      await Promise.all(
        [clientA, clientB].map(
          (client) => new Promise((resolve, reject) => {
            client.once("connect", resolve);
            client.once("connect_error", reject);
          })
        )
      );
      const delivered = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("delivery timed out")), 2000);
        clientB.once("message:new", (message) => {
          clearTimeout(timeout);
          resolve(message);
        });
      });
      ioA.to(userB).emit("message:new", { id: "message-1" });
      assert.deepEqual(await delivered, { id: "message-1" });
    } finally {
      clientA.close();
      clientB.close();
      await Promise.all([
        new Promise((resolve) => ioA.close(resolve)),
        new Promise((resolve) => ioB.close(resolve)),
      ]);
      await Promise.all([redisA.close(), redisB.close()]);
    }
  }
);
