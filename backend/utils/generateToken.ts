import jwt from 'jsonwebtoken';

/**
 * Signs and generates a JWT token for a given user payload.
 */
export const generateToken = (payload: {
  id: string;
  email: string;
  name: string;
  role: string;
  storeName?: string;
  avatar?: string;
}): string => {
  const secret = process.env.JWT_SECRET || 'printflow_secure_jwt_secret_key_2024_xyz';
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
  });
};

export default generateToken;
