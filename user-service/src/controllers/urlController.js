import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../config/db.js';
import generateShortCode from '../utils/generateShortCode.js';
import {
  isShortCodeTaken,
  createShortUrl,
  getUserShortUrls,
  getShortUrlDetail,
  deleteShortUrl
} from '../models/urlModel.js';

export async function create(req, res) {
  const { userId } = req.params;
  const { longUrl, customShort, expiresInDays } = req.body;

  if (!longUrl || !expiresInDays) {
    return res.status(400).json({
      errors: [{ field: 'input', message: 'longUrl and expiresInDays required' }],
    });
  }

  let shortCode = customShort || generateShortCode();
  const redisKey = `shortcode:${shortCode}`;

  try {
    const existsInRedis = await redisClient.exists(redisKey);
    const existsInPg = await isShortCodeTaken(shortCode);

    if (existsInRedis || existsInPg) {
      return res.status(409).json({
        errors: [{ field: 'shortCode', message: 'Short code already taken.' }],
      });
    }

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

    const ttl = expiresInDays * 86400;
    await redisClient.setEx(`shorturl:${shortCode}`, ttl, longUrl);

    return res.status(201).json({ ...data, isActive: true });
  } catch (err) {
    console.error('[CREATE SHORT URL ERROR]', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}

export async function list(req, res) {
  const { userId } = req.params;

  try {
    const urls = await getUserShortUrls(userId);
    const now = new Date();

    const data = urls.map((url) => ({
      ...url,
      isActive: new Date(url.expires_at) > now
    }));

    return res.json({
      data,
      pagination: { total: data.length }
    });
  } catch (err) {
    console.error('[LIST URL ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function detail(req, res) {
  const { userId, shortCode } = req.params;

  try {
    const url = await getShortUrlDetail(userId, shortCode);
    if (!url) {
      return res.status(404).json({ error: 'URL not found.' });
    }

    const isActive = new Date(url.expires_at) > new Date();
    return res.json({ ...url, isActive });
  } catch (err) {
    console.error('[DETAIL URL ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}

export async function remove(req, res) {
  const { userId, shortCode } = req.params;

  try {
    const deleted = await deleteShortUrl(userId, shortCode);
    if (!deleted) {
      return res.status(404).json({ error: 'URL not found or not owned.' });
    }

    await redisClient.del(`shorturl:${shortCode}`);
    return res.json({ message: 'Short URL deleted successfully.' });
  } catch (err) {
    console.error('[REMOVE URL ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}