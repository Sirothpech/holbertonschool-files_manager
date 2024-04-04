import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AuthController = {
  async getConnect(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
      const [email, password] = credentials.split(':');

      const user = await dbClient.db.collection('users').findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (sha1(password) !== user.password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id, 24 * 60 * 60); // Store token in Redis for 24 hours

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error during authentication:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getDisconnect(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userObjectId = ObjectId(userId);
      const user = await dbClient.db.collection('users').findOne({ _id: userObjectId });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await redisClient.del(key); // Delete token from Redis
      return res.status(204).end();
    } catch (error) {
      console.error('Error during disconnection:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default AuthController;
