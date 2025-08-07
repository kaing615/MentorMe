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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Course: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Course ID'
            },
            name: {
              type: 'string',
              description: 'Course name/title'
            },
            courseOverview: {
              type: 'string',
              description: 'Detailed course overview'
            },
            keyLearningObjectives: {
              type: 'string',
              description: 'Key learning objectives'
            },
            thumbnail: {
              type: 'string',
              description: 'Course thumbnail image URL'
            },
            price: {
              type: 'number',
              description: 'Course price'
            },
            mentors: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of mentor IDs'
            },
            category: {
              type: 'string',
              description: 'Course category'
            },
            level: {
              type: 'string',
              enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
              description: 'Course difficulty level'
            },
            lectures: {
              type: 'number',
              description: 'Number of lectures'
            },
            duration: {
              type: 'number',
              description: 'Course duration in hours'
            },
            link: {
              type: 'string',
              description: 'Google Drive materials link'
            },
            rate: {
              type: 'number',
              description: 'Average rating'
            },
            numberOfRatings: {
              type: 'number',
              description: 'Total number of ratings'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Course tags'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(options);
export default specs;
