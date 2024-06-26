import RedisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  async getStatus(req, res) {
    try {
      const redisAlive = RedisClient.isAlive();
      const dbAlive = dbClient.isAlive();
      res.status(200).json({ redis: redisAlive, db: dbAlive });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getStats(req, res) {
    try {
      const nbUsers = await dbClient.nbUsers();
      const nbFiles = await dbClient.nbFiles();
      res.status(200).json({ users: nbUsers, files: nbFiles });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default AppController;
