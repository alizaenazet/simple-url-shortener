import jwt from 'jsonwebtoken';
import { urlService } from './service.js';
import { urlValidator } from './validator.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { handleServiceError } from '../../middleware/errorHandler.js';

class UrlController {
    async create(req, res) {
        try {
            const { longUrl, customShort, expiresInDays } = req.body;
            const userId = req.user.userId;

            // Validation
            const validationErrors = urlValidator.validateCreate({ longUrl, customShort, expiresInDays });
            if (validationErrors.length > 0) {
                return res.status(400).json(errorResponse('Validation failed.', validationErrors));
            }

            const result = await urlService.create(userId, { longUrl, customShort, expiresInDays }, req);
            res.status(201).json(successResponse('Short URL created successfully.', result));

        } catch (error) {
            if (error.response?.status === 409) {
                return res.status(409).json(errorResponse(
                    'Custom short URL is already taken.',
                    [{ field: 'customShort', message: 'The custom short code is already in use. Please choose another one or leave it blank for an auto-generated code.' }]
                ));
            }

            const errorRes = handleServiceError(error, 'Failed to create the short URL.');
            res.status(errorRes.status).json(errorRes.data);
        }
    }

    async getAll(req, res) {
        try {
            const userId = req.user.userId;
            const queryParams = req.query;
            console.log("COOOOOKKK 🚀");
            
            const result = await urlService.getAll(userId, queryParams, req);
            res.status(200).json(successResponse("User's short URLs retrieved successfully.", result.data)); 

        } catch (error) {
            const errorRes = handleServiceError(error, "Failed to retrieve user's short URLs.");
            res.status(errorRes.status).json(errorRes.data);
        }
    }

    async getOne(req, res) {
        try {
            const userId = req.user.userId;
            const { shortCode } = req.params;

            const result = await urlService.getOne(userId, shortCode, req);
            res.status(200).json(successResponse('Short URL details retrieved successfully.', result));

        } catch (error) {
            if (error.response?.status === 404) {
                return res.status(404).json(errorResponse(
                    'Short URL not found.',
                    [{ code: 'URL_NOT_FOUND', message: 'The requested short URL does not exist or does not belong to you.' }]
                ));
            }

            if (error.response?.status === 403) {
                return res.status(403).json(errorResponse(
                    'Access denied. You do not own this short URL.',
                    [{ code: 'FORBIDDEN_ACCESS', message: 'User does not have permission to access this resource.' }]
                ));
            }

            const errorRes = handleServiceError(error, 'Failed to retrieve short URL details.');
            res.status(errorRes.status).json(errorRes.data);
        }
    }

    async delete(req, res) {
        try {
            const userId = req.user.userId;
            const { shortCode } = req.params;

            await urlService.delete(userId, shortCode, req);
            res.status(200).json(successResponse('Short URL deleted successfully.'));

        } catch (error) {
            if (error.response?.status === 404) {
                return res.status(404).json(errorResponse(
                    'Short URL not found.',
                    [{ code: 'URL_NOT_FOUND', message: 'The requested short URL does not exist or does not belong to you.' }]
                ));
            }

            if (error.response?.status === 403) {
                return res.status(403).json(errorResponse(
                    'Access denied. You do not own this short URL.',
                    [{ code: 'FORBIDDEN_ACCESS', message: 'User does not have permission to access this resource.' }]
                ));
            }

            const errorRes = handleServiceError(error, 'Failed to delete the short URL.');
            res.status(errorRes.status).json(errorRes.data);
        }
    }
}

export const urlController = new UrlController();
