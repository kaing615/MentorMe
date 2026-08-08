import assert from "node:assert/strict";
import test from "node:test";
import { signAccessToken } from "../../src/modules/identity/access-token.js";

const secret = "socket-test-access-secret-at-least-32-characters";
const userId = "507f1f77bcf86cd799439011";

function runAuthentication(middleware, socket) {
  return new Promise((resolve) => {
    middleware(socket, (error) => resolve(error));
  });
}

test("socket authentication derives the room identity from a valid access JWT", async () => {
  const module = await import(
    "../../src/socket/authenticate-socket.js"
  ).catch(() => ({}));
  assert.equal(typeof module.createSocketAuthenticator, "function");

  const token = signAccessToken({ id: userId, role: "mentee" }, { secret });
  const socket = { handshake: { auth: { token }, headers: {} }, data: {} };
  const error = await runAuthentication(
    module.createSocketAuthenticator({ jwtAccessSecret: secret }),
    socket
  );

  assert.equal(error, undefined);
  assert.equal(socket.data.userId, userId);
  assert.equal(socket.data.role, "mentee");
});

test("socket authentication rejects a caller-supplied userId without a JWT", async () => {
  const { createSocketAuthenticator } = await import(
    "../../src/socket/authenticate-socket.js"
  );
  const socket = {
    handshake: { auth: { userId }, headers: {} },
    data: {},
  };
  const error = await runAuthentication(
    createSocketAuthenticator({ jwtAccessSecret: secret }),
    socket
  );

  assert.equal(error?.message, "Unauthorized");
  assert.equal(socket.data.userId, undefined);
});
