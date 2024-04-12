const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
import dbClient from './utils/db';
import fs from 'fs';
import { ObjectId } from 'mongodb';

const fileQueue = new Bull('fileQueue');
fileQueue.process(async (job, done)  => {
    const { fileId, userId } = job.data;

    // Check if fileId and userId are present in the job
    if (!fileId) {
        throw new Error('Missing fileId');
    }
    if (!userId) {
        throw new Error('Missing userId');
    }
    // Check if document is found in DB based on the fileId and userId
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });
    if (!file) {
        throw new Error('File not found');
    }


    // Generate thumbnails
    const thumbnails = [];
    const sizes = [500, 250, 100];
    for (const size of sizes) {
        const thumbnail = await imageThumbnail(file.folderPath, { width: size });
        const thumbnailPath = `${file.folderPath}_${size}`;
        // Save the thumbnail to the same location with the appended width size
        fs.writeFileSync(thumbnailPath, thumbnail);
        thumbnails.push({ size, path: thumbnailPath });
    }

    done();
    return thumbnails;
});

module.exports = fileQueue;
