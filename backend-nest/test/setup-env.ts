process.env.NODE_ENV ??= "test";
process.env.PORT ??= "4001";
process.env.MONGO_URL ??=
  "mongodb://127.0.0.1:27018/mentorme_nest_test?replicaSet=rs0";
process.env.JWT_SECRET ??= "nest-test-secret-with-enough-length";
process.env.CORS_ORIGINS ??= "http://localhost:5173";
