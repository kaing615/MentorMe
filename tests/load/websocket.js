import ws from "k6/ws";
import { check, sleep } from "k6";

const socketUrl = __ENV.SOCKET_URL || "ws://localhost/socket.io/?EIO=4&transport=websocket";
const token = __ENV.ACCESS_TOKEN;

export const options = {
  vus: 100,
  duration: __ENV.DURATION || "2m",
  thresholds: {
    checks: ["rate>0.99"],
    ws_connecting: ["p(95)<1000"],
  },
};

export default function () {
  if (!token) throw new Error("ACCESS_TOKEN is required");
  const response = ws.connect(socketUrl, {}, (socket) => {
    socket.on("open", () => {
      socket.send(`40${JSON.stringify({ token })}`);
    });
    socket.setTimeout(() => socket.close(), 30_000);
  });
  check(response, { "websocket upgraded": (result) => result?.status === 101 });
  sleep(1);
}
