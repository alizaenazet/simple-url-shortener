import { verifyToken } from '../utils/jwtHelper.js';

export default async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        errors: [{ code: 'TOKEN_MISSING', message: 'Authentication token is required' }]
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = await verifyToken(token);
      
      // Store user info in request object
      req.user = decoded;
      
      // Check if the userId in the URL matches the token userId
      const { userId } = req.params;
      if (userId && userId !== decoded.userId) {
        return res.status(403).json({
          errors: [{ code: 'FORBIDDEN', message: 'You do not have permission to access this resource' }]
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({
        errors: [{ code: 'TOKEN_INVALID', message: error.message }]
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      errors: [{ code: 'SERVER_ERROR', message: 'Internal server error during authentication' }]
    });
  }
}
