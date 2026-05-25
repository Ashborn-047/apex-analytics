import { Hono } from 'hono';

export const openapiRouter = new Hono();

const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "APEX F1 Analytical Platform API",
    version: "1.0.0",
    description: "Main REST API for APEX historical data, circuit geometries, and statistics."
  },
  servers: [
    {
      url: "/api",
      description: "APEX API Service"
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key"
      }
    }
  },
  security: [
    {
      ApiKeyAuth: []
    }
  ],
  paths: {
    "/health": {
      "get": {
        "summary": "API Health Check",
        "security": [],
        "responses": {
          "200": {
            "description": "Healthy",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string" },
                    "database": { "type": "string" },
                    "redis": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/circuits": {
      "get": {
        "summary": "Get all circuits",
        "responses": {
          "200": {
            "description": "List of circuits",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string" },
                          "name": { "type": "string" },
                          "location": { "type": "string" },
                          "country": { "type": "string" },
                          "firstGp": { "type": "integer" },
                          "lengthKm": { "type": "number" },
                          "corners": { "type": "integer" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/circuits/{id}/geometry": {
      "get": {
        "summary": "Get circuit 2D points and elevation profile",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Circuit geometry",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "circuitId": { "type": "string" },
                    "circuitName": { "type": "string" },
                    "geometry": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "x": { "type": "number" },
                          "y": { "type": "number" },
                          "z": { "type": "number" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/seasons": {
      "get": {
        "summary": "Get all seasons",
        "responses": {
          "200": {
            "description": "List of seasons",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "year": { "type": "integer" },
                          "rounds": { "type": "integer" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/races/{season}": {
      "get": {
        "summary": "Get all races in a season",
        "parameters": [
          {
            "name": "season",
            "in": "path",
            "required": true,
            "schema": { "type": "integer" }
          }
        ],
        "responses": {
          "200": {
            "description": "List of races",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "integer" },
                          "season": { "type": "integer" },
                          "round": { "type": "integer" },
                          "circuitId": { "type": "string" },
                          "date": { "type": "string" },
                          "name": { "type": "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/drivers": {
      "get": {
        "summary": "Get paginated drivers list",
        "parameters": [
          {
            "name": "limit",
            "in": "query",
            "schema": { "type": "integer", "default": 20 }
          },
          {
            "name": "offset",
            "in": "query",
            "schema": { "type": "integer", "default": 0 }
          }
        ],
        "responses": {
          "200": {
            "description": "Paginated drivers",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string" },
                          "code": { "type": "string" },
                          "name": { "type": "string" },
                          "dob": { "type": "string" },
                          "nationality": { "type": "string" }
                        }
                      }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "total": { "type": "integer" },
                        "limit": { "type": "integer" },
                        "offset": { "type": "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/constructors": {
      "get": {
        "summary": "Get all constructors",
        "responses": {
          "200": {
            "description": "List of constructors",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "data": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "id": { "type": "string" },
                          "name": { "type": "string" },
                          "nationality": { "type": "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

openapiRouter.get('/openapi.json', (c) => {
  return c.json(openapiSpec);
});
