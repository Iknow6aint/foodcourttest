/**
 * Swagger Documentation Examples
 * This file contains example objects for API documentation
 */

export const SwaggerExamples = {
  // Rider Profile Examples
  RIDER_PROFILE: {
    id: 1,
    name: 'James Wilson',
    email: 'james.wilson@fooddelivery.com',
    phone: '+2348123456789',
    is_available: true,
    vehicle_type: 'motorcycle',
    profile_image_url: 'https://example.com/images/james-wilson.jpg',
    created_at: '2025-07-22T10:30:00.000Z',
  },

  // Location Update Examples
  LOCATION_UPDATE_REQUEST: {
    current_latitude: 37.7749,
    current_longitude: -122.4194,
  },

  LOCATION_UPDATE_RESPONSE: {
    success: true,
    message: 'Location updated successfully',
    data: {
      id: 1,
      name: 'James Wilson',
      current_latitude: '37.77490000',
      current_longitude: '-122.41940000',
      last_location_update: '2025-07-22T12:35:44.623Z',
      is_available: true,
    },
    timestamp: '2025-07-22T12:35:44.623Z',
  },

  // Availability Update Examples
  AVAILABILITY_UPDATE_REQUEST: {
    is_available: true,
  },

  AVAILABILITY_UPDATE_RESPONSE: {
    success: true,
    message: 'Rider is now available',
    data: {
      id: 1,
      name: 'James Wilson',
      email: 'james.wilson@fooddelivery.com',
      phone: '+2348123456789',
      is_available: true,
      vehicle_type: 'motorcycle',
      profile_image_url: 'https://example.com/images/james-wilson.jpg',
      created_at: '2025-07-22T10:30:00.000Z',
    },
    timestamp: '2025-07-22T12:35:59.824Z',
  },

  // Profile Update Examples
  PROFILE_UPDATE_REQUEST: {
    vehicle_type: 'motorcycle',
    license_plate: 'ABC-123',
  },

  // Error Response Examples
  VALIDATION_ERROR: {
    message: [
      'Latitude must be between -90 and 90',
      'Longitude must be between -180 and 180',
    ],
    error: 'Bad Request',
    statusCode: 400,
  },

  UNAUTHORIZED_ERROR: {
    message: 'Valid rider authentication required',
    error: 'Unauthorized',
    statusCode: 401,
  },

  NOT_FOUND_ERROR: {
    message: 'Rider with ID 999 not found or inactive',
    error: 'Not Found',
    statusCode: 404,
  },

  COORDINATE_VALIDATION_ERROR: {
    message:
      'Invalid coordinates: Latitude must be between -90 and 90, longitude between -180 and 180',
    error: 'Bad Request',
    statusCode: 400,
  },

  // Location Data Example
  CURRENT_LOCATION: {
    id: 1,
    name: 'James Wilson',
    current_latitude: '37.77490000',
    current_longitude: '-122.41940000',
    last_location_update: '2025-07-22T12:35:44.623Z',
    is_available: true,
  },

    // Order Assignment Examples
  orderAssignmentSuccess: {
    'Assignment Success': {
      summary: 'Successful order assignment',
      value: {
        success: true,
        message: 'Order assigned successfully',
        data: {
          assignmentId: 123,
          riderId: 1,
          orderData: {
            order_id: 456,
            order_description: "Pizza delivery from Mario's Restaurant",
            customer_name: 'John Smith',
            delivery_address: '123 Main St, Downtown',
            priority: 'high',
          },
          assignedAt: '2025-07-22T12:45:00.000Z',
        },
        timestamp: '2025-07-22T12:45:00.000Z',
      },
    },
  },

  validationError: {
    'Validation Failed': {
      summary: 'Invalid request data',
      value: {
        message: [
          'order_id must be a positive integer',
          'customer_name should not be empty',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  },

  notFoundError: {
    'Rider Not Found': {
      summary: 'Rider ID not found',
      value: {
        message: 'Rider with ID 999 not found',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  },
};

export const SwaggerSchemas = {
  ErrorResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Error message',
      },
      error: {
        type: 'string',
        description: 'Error type',
      },
      statusCode: {
        type: 'number',
        description: 'HTTP status code',
      },
    },
  },

  ValidationErrorResponse: {
    type: 'object',
    properties: {
      message: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array of validation error messages',
      },
      error: {
        type: 'string',
        description: 'Error type',
      },
      statusCode: {
        type: 'number',
        description: 'HTTP status code',
      },
    },
  },
};
