import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";
dotenv.config();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MentorMe API Docs",
      version: "1.0.0",
      description: "API documentation for MentorMe backend",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(options);
export default specs;
