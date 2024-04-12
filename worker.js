const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('../holbertonschool-files_manager/utils/db'); // Import your database client

const fileQueue = new Bull('fileQueue');
console.log('fileQueue');
fileQueue.process(async (job, done)  => {
    const { fileId, userId } = job.data;

    // Check if fileId and userId are present in the job
    if (!fileId) {
      console.log('hello1');
        throw new Error('Missing fileId');
    }
    if (!userId) {
      console.log('hello2');
        throw new Error('Missing userId');
    }
    // Check if document is found in DB based on the fileId and userId
    const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId });
    if (!file) {
      console.log('hello3');
        throw new Error('File not found');
    }


    // Generate thumbnails
    const thumbnails = [];
    const sizes = [500, 250, 100];
    for (const size of sizes) {
      console.log('hello4');
        const thumbnail = await imageThumbnail(file.folderPath, { width: size });
        const thumbnailPath = `${file.folderPath}_${size}`;
        // Save the thumbnail to the same location with the appended width size
        fs.writeFileSync(thumbnailPath, thumbnail);
        thumbnails.push({ size, path: thumbnailPath });
      console.log(thumbnail);
    }

    done();
    return thumbnails;
});

module.exports = fileQueue;
