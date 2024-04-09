import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
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

  static async getShow(req, res) {
    // verify user
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

    // verify file
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).send({ error: 'Not found' });
    }
    const document = { _id: ObjectId(fileId) };
    const file = await dbClient.db.collection('files').findOne(document);
    if (!file) {
      return res.status(404).send({ error: 'Not found123' });
    }

    // return file document
    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    });
  }

  static async getIndex(req, res) {
    // verify user
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

    // prepare to aggregate
    const parentId = req.query.parentId || 0;
    const page = req.query.page || 0;

    let match;
    if (parentId === 0) {
      match = {};
    } else {
      match = { parentId: parentId === '0' ? Number(parentId) : ObjectId(parentId) };
    }
    const limit = 20;
    const skip = page * limit;

    // aggregate
    const files = await dbClient.db.collection('files').aggregate([
      { $match: match },
      { $skip: skip },
      { $limit: limit },
    ]).toArray();

    // return the list of file document
    const filesList = files.map((file) => ({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId,
    }));
    return res.status(200).send(filesList);
  }

  static async putPublish(req, res) {
    // verify user
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

    // verify file
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).send({ error: 'Not found' });
    }
    const document = { _id: ObjectId(fileId) };
    const file = await dbClient.db.collection('files').findOne(document);
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (user._id.toString() !== file.userId.toString()) {
      return res.status(404).json({ error: 'Not found' });
    }

    // update file
    const updatedDocument = { $set: { isPublic: true } };
    await dbClient.db.collection('files').updateOne(document, updatedDocument);

    // return file document
    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId,
    });
  }

  static async putUnpublish(req, res) {
    // verify user
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

    // verify file
    const fileId = req.params.id;
    if (!fileId) {
      return res.status(404).send({ error: 'Not found' });
    }
    const document = { _id: ObjectId(fileId) };
    const file = await dbClient.db.collection('files').findOne(document);
    if (!file) {
      return res.status(404).send({ error: 'Not found' });
    }
    if (user._id.toString() !== file.userId.toString()) {
      return res.status(404).json({ error: 'Not found' });
    }

    // update file
    const updatedDocument = { $set: { isPublic: false } };
    await dbClient.db.collection('files').updateOne(document, updatedDocument);

    // return file document
    return res.status(200).send({
      id: file._id,
      userId: file.userId,
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId,
    });
  }

  static async getFile(req, res) {
    // check if the file exists
    const fileId = ObjectId(req.params.id);
    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({ _id: fileId });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // if the document is private, check if the user is the owner and authenticated
    if (!file.isPublic) {
      const token = req.headers['x-token'];
      if (!token) return res.status(404).json({ error: 'Not found' });
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) return res.status(404).json({ error: 'Not found' });
      if (userId !== file.userId.toString()) return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') return res.status(400).json({ error: 'A folder doesn\'t have content' });

    // Check if the file is locally present
    const filePath = file.folderPath; // Assuming folderPath contains the local path of the file
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found locally' });
    }

    // Retrieve the MIME type of the file based on its name
    const mimeType = mime.lookup(file.name);

    // Return the content of the file with the correct MIME type
    res.setHeader('Content-Type', mimeType);
    return fs.createReadStream(filePath).pipe(res);
  }
}

export default FilesController;
