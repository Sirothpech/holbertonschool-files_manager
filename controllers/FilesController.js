import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

const FilesController = {
  async postUpload(req, res) {
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

      const {
        name, type, parentId, isPublic, data,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing or invalid type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId) {
        const parent = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parent) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const file = {
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || '0',
      };

      if (type !== 'folder') {
        const fileData = Buffer.from(data, 'base64').toString('utf-8');
        const fileId = uuidv4();
        const localPath = path.join(folderPath, fileId);
        fs.writeFileSync(localPath, fileData);
        file.localPath = localPath;
      }

      const result = await dbClient.db.collection('files').insertOne(file);
      file.id = result.insertedId;
      delete file._id;

      return res.status(201).json(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

export default FilesController;
