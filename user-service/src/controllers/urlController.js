import { v4 as uuidv4 } from 'uuid';
import { redisClient, dbHealth } from '../config/db.js';
import generateShortCode from '../utils/generateShortCode.js';
import {
  isShortCodeTaken,
  createShortUrl,
  getUserShortUrls,
  getShortUrlDetail,
  deleteShortUrl
} from '../models/urlModel.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export async function create(req, res) {
  const { userId } = req.params;
  const { longUrl, customShort, expiresInDays } = req.body;

  // Validation
  const errors = validateUrlInput(longUrl, customShort, expiresInDays);
  if (errors.length > 0) {
    return res.status(400).json(errorResponse('Validation failed.', errors));
  }

  try {
    let shortCode = customShort || generateShortCode();
    
    // Check if shortCode is already taken
    const shortCodeExists = await checkShortCodeExists(shortCode);
    if (shortCodeExists) {
      return res.status(409).json(errorResponse(
        'Custom short URL is already taken.',
        [{
          field: 'customShort',
          message: `The custom short code '${shortCode}' is already in use. Please choose another one or leave it blank for an auto-generated code.`
        }]
      ));
    }

    // Create short URL
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);

    const data = await createShortUrl({
      shortUrlId: uuidv4(),
      userId,
      longUrl,
      shortCode,
      createdAt: now,
      expiresAt
    });

    // Add to Redis cache if available
    if (dbHealth.redis.connected) {
      try {
        const ttl = expiresInDays * 86400; // days to seconds
        await redisClient.setEx(`shorturl:${shortCode}`, ttl, longUrl);
      } catch (redisError) {
        console.error('Redis caching error:', redisError);
        // Continue - Redis is just a cache, not critical for operation
      }
    }

    // Format response according to API spec
    const fullShortUrl = `${process.env.SHORT_URL_DOMAIN || 'http://127.0.0.1:8080'}/${shortCode}`;
    
    return res.status(201).json(successResponse('Short URL created successfully.', {
      shortUrlId: data.short_url_id,
      longUrl: data.long_url,
      shortCode: data.short_code,
      fullShortUrl,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      visits: data.visits
    }));
  } catch (error) {
    console.error('[CREATE SHORT URL ERROR]', error);
    
    if (error.message === 'Database unavailable') {
      return res.status(503).json(errorResponse(
        'Service temporarily unavailable.',
        [{ code: 'SERVICE_UNAVAILABLE', message: 'URL shortening service is temporarily unavailable. Please try again later.' }]
      ));
    }
    
    return res.status(500).json(errorResponse(
      'An internal server error occurred while creating the short URL.',
      [{ code: 'SHORT_URL_CREATION_FAILED', message: 'Failed to create the short URL.' }]
    ));
  }
}

export async function list(req, res) {
  const { userId } = req.params;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status = 'all' } = req.query;

  try {
    // Convert API parameter names to DB column names
    const sortMapping = {
      'createdAt': 'created_at',
      'expiresAt': 'expires_at',
      'visits': 'visits'
    };
    const dbSortField = sortMapping[sortBy] || 'created_at';
    const dbSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    const urls = await getUserShortUrls(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortField: dbSortField,
      sortOrder: dbSortOrder,
      status
    });
    
    const now = new Date();
    
    // Format response according to API spec
    const formattedUrls = urls.data.map(url => {
      const fullShortUrl = `${process.env.SHORT_URL_DOMAIN || 'http://127.0.0.1:8080'}/${url.short_code}`;
      return {
        shortUrlId: url.short_url_id,
        longUrl: url.long_url,
        shortCode: url.short_code,
        fullShortUrl,
        createdAt: url.created_at,
        expiresAt: url.expires_at,
        visits: url.visits,
        isActive: new Date(url.expires_at) > now
      };
    });

    return res.json(successResponse("User's short URLs retrieved successfully.", formattedUrls, {
      pagination: urls.pagination
    }));
  } catch (error) {
    console.error('[LIST URL ERROR]', error);
    
    if (error.message === 'Database unavailable') {
      return res.status(503).json(errorResponse(
        'Service temporarily unavailable.',
        [{ code: 'SERVICE_UNAVAILABLE', message: 'URL listing service is temporarily unavailable. Please try again later.' }]
      ));
    }
    
    return res.status(500).json(errorResponse(
      'An internal server error occurred while retrieving short URLs.',
      [{ code: 'FETCH_URLS_FAILED', message: "Failed to retrieve user's short URLs." }]
    ));
  }
}

export async function detail(req, res) {
  const { userId, shortCode } = req.params;

  try {
    const url = await getShortUrlDetail(userId, shortCode);
    if (!url) {
      return res.status(404).json(errorResponse(
        'Short URL not found.',
        [{ code: 'URL_NOT_FOUND', message: 'The requested short URL does not exist or does not belong to you.' }]
      ));
    }

    // Format response according to API spec
    const fullShortUrl = `${process.env.SHORT_URL_DOMAIN || 'http://127.0.0.1:8080'}/${url.short_code}`;
    const isActive = new Date(url.expires_at) > new Date();
    
    return res.json(successResponse('Short URL details retrieved successfully.', {
      shortUrlId: url.short_url_id,
      longUrl: url.long_url,
      shortCode: url.short_code,
      fullShortUrl,
      createdAt: url.created_at,
      expiresAt: url.expires_at,
      visits: url.visits,
      isActive
    }));
  } catch (error) {
    console.error('[DETAIL URL ERROR]', error);
    
    if (error.message === 'Database unavailable') {
      return res.status(503).json(errorResponse(
        'Service temporarily unavailable.',
        [{ code: 'SERVICE_UNAVAILABLE', message: 'URL details service is temporarily unavailable. Please try again later.' }]
      ));
    }
    
    return res.status(500).json(errorResponse(
      'An internal server error occurred while retrieving the short URL details.',
      [{ code: 'FETCH_URL_DETAILS_FAILED', message: 'Failed to retrieve short URL details.' }]
    ));
  }
}

export async function remove(req, res) {
  const { userId, shortCode } = req.params;

  try {
    // First check if the URL exists and belongs to the user
    const url = await getShortUrlDetail(userId, shortCode);
    if (!url) {
      return res.status(404).json(errorResponse(
        'Short URL not found.',
        [{ code: 'URL_NOT_FOUND', message: 'The requested short URL does not exist or does not belong to you.' }]
      ));
    }

    // Delete from database
    await deleteShortUrl(userId, shortCode);
    
    // Remove from Redis cache if available
    if (dbHealth.redis.connected) {
      try {
        await redisClient.del(`shorturl:${shortCode}`);
      } catch (redisError) {
        console.warn('Redis deletion error:', redisError);
        // Continue - Redis is just a cache
      }
    }

    return res.json(successResponse('Short URL deleted successfully.'));
  } catch (error) {
    console.error('[REMOVE URL ERROR]', error);
    
    if (error.message === 'Database unavailable') {
      return res.status(503).json(errorResponse(
        'Service temporarily unavailable.',
        [{ code: 'SERVICE_UNAVAILABLE', message: 'URL deletion service is temporarily unavailable. Please try again later.' }]
      ));
    }
    
    return res.status(500).json(errorResponse(
      'An internal server error occurred while deleting the short URL.',
      [{ code: 'URL_DELETION_FAILED', message: 'Failed to delete the short URL.' }]
    ));
  }
}

// Helper functions
function validateUrlInput(longUrl, customShort, expiresInDays) {
  const errors = [];
  
  if (!longUrl) {
    errors.push({ field: 'longUrl', message: 'Long URL is required.' });
  } else {
    try {
      new URL(longUrl); // Validate URL format
    } catch (e) {
      errors.push({ field: 'longUrl', message: 'Must be a valid URL.' });
    }
  }
  
  if (!expiresInDays || isNaN(expiresInDays) || expiresInDays < 1 || expiresInDays > 30) {
    errors.push({ field: 'expiresInDays', message: 'Expiration must be between 1 and 30 days.' });
  }
  
  if (customShort) {
    if (!/^[a-zA-Z0-9_-]+$/.test(customShort)) {
      errors.push({ field: 'customShort', message: 'Custom short code contains invalid characters.' });
    }
    
    if (customShort.length < 3 || customShort.length > 50) {
      errors.push({ field: 'customShort', message: 'Custom short code must be between 3 and 50 characters.' });
    }
  }
  
  return errors;
}

async function checkShortCodeExists(shortCode) {
  // Try Redis first (faster)
  if (dbHealth.redis.connected) {
    try {
      const exists = await redisClient.exists(`shorturl:${shortCode}`);
      if (exists) return true;
    } catch (error) {
      console.warn('Redis check failed:', error.message);
      // Fall back to Postgres
    }
  }
  
  // Check in Postgres
  if (dbHealth.postgres.connected) {
    try {
      return await isShortCodeTaken(shortCode);
    } catch (error) {
      console.error('Postgres check failed:', error.message);
      throw new Error('Database unavailable');
    }
  }
  
  throw new Error('Database unavailable');
}