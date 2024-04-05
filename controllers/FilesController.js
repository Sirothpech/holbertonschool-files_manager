import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    // Verify users
    const xToken = req.headers['x-token'];
    if (!xToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Verify setting
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).send({ error: 'Missing data' });
    }

    // Verify parent
    if (parentId) {
      if (!await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) })) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (!await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId), type: 'folder' })) {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    // Handle file upload
    if (type === 'folder') {
      const document = {
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: 0,
      };
      const insertedFolder = await dbClient.db.collection('files').insertOne(document);
      return res.status(201).send({
        id: insertedFolder.insertedId,
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: 0,
      });
    }
    {
      let folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const filename = uuidv4();
      const clearData = Buffer.from(data, 'base64').toString('utf-8');
      try {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
        }
        folderPath = `${folderPath}/${filename}`;
        fs.writeFileSync(folderPath, clearData, (err) => {
          if (err) throw err;
        });
      } catch (error) {
        console.log(error);
      }
      const document = {
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: parentId || 0,
        folderPath,
      };

      const insertedFile = await dbClient.db.collection('files').insertOne(document);

      return res.status(201).send({
        id: insertedFile.insertedId,
        userId,
        name,
        type,
        isPublic: !!isPublic,
        parentId: parentId || 0,
      });
    }
  }
}

export default FilesController;
