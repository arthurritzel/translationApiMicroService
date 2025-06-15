import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    version: "1.0.0",
    title: "Translation API",
    description: "API para tradução de textos com processamento assíncrono"
  },
  servers: [
    {
      url: "http://localhost:4040",
    }
  ],
  components: {
    schemas: {
      InternalServerError: {
        code: "",
        message: "",
      },
      Translation: {
        requestId: { type: "string", format: "uuid" },
        text: { type: "string" },
        translatedText: { type: "string" },
        sourceLang: { type: "string" },
        targetLang: { type: "string" },
        status: { type: "string", enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"] },
        errorMessage: { type: "string" },
        errorCode: { type: "string" },
        retryCount: { type: "integer" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        queuedAt: { type: "string", format: "date-time" }
      },
      TranslationRequest: {
        text: { type: "string" },
        sourceLang: { type: "string" },
        targetLang: { type: "string" }
      },
      TranslationStatusUpdate: {
        status: { type: "string", enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"] },
        translatedText: { type: "string" },
        errorMessage: { type: "string" },
        errorCode: { type: "string" }
      }
    }
  }
};

const outputFile = "./config/swagger.json";
const endpointsFiles = ["./routes.js"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc)
  .then(async () => {
    await import("./server.js");
  });