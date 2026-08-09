import { createConnection } from "mongoose";
import { runWorker } from "../../src/worker";

describe("availability cleanup worker", () => {
  it("deletes availability older than three days and exits", async () => {
    const connection = await createConnection(
      process.env.MONGO_URL ??
        "mongodb://127.0.0.1:27018/mentorme_nest_test?replicaSet=rs0",
    ).asPromise();
    await connection.dropDatabase();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const old = new Date(today);
    old.setUTCDate(old.getUTCDate() - 4);
    const retained = new Date(today);
    retained.setUTCDate(retained.getUTCDate() - 3);
    await connection.collection("availabilities").insertMany([
      { mentor: "old", date: old, slots: [] },
      { mentor: "retained", date: retained, slots: [] },
    ]);
    await connection.close();

    await runWorker();

    const verification = await createConnection(
      process.env.MONGO_URL ??
        "mongodb://127.0.0.1:27018/mentorme_nest_test?replicaSet=rs0",
    ).asPromise();
    try {
      const remaining = await verification
        .collection("availabilities")
        .find({})
        .toArray();
      expect(remaining.map(({ mentor }) => String(mentor))).toEqual(["retained"]);
    } finally {
      await verification.dropDatabase();
      await verification.close();
    }
  });
});
