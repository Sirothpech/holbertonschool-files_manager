import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const userExists = await dbClient.db.collection('users').findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);
    const newUser = {
      email,
      password: hashedPassword,
    };

    try {
      const result = await dbClient.db.collection('users').insertOne(newUser);
      const { insertedId } = result;
      return res.status(201).json({ id: insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  },
  async getMe(req, res) {
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
      const user = await dbClient.db.collection('users').findOne({ _id: userObjectId }, { projection: { _id: 1, email: 1 } });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user details:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default UsersController;
