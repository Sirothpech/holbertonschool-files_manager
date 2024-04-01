README

# Files Manager

## Introduction
The Files Manager is an application designed to manage files and folders in a system. It provides functionalities for storing files, retrieving file data, managing users, and more. This README provides an overview of the tasks implemented in the application.

## Installation
To install and run the Files Manager application, follow these steps:

1. Clone the repository to your local machine:

```
git clone <repository-url>
```

2. Navigate to the project directory:

```
cd files-manager
```

3. Install dependencies:

```
npm install
```

4. Start the server:

```
npm run start-server
```

## Tasks Implemented

### 0. Redis Utils
- Created a Redis client class (`RedisClient`) with functions to interact with Redis, such as `get`, `set`, and `del`.
- Implemented error handling for the Redis client.
- Exported an instance of `RedisClient` called `redisClient`.

### 1. MongoDB Utils
- Created a MongoDB client class (`DBClient`) with functions to interact with MongoDB, such as `nbUsers` and `nbFiles`.
- Implemented error handling for the MongoDB client.
- Exported an instance of `DBClient` called `dbClient`.

### 2. First API
- Created an Express server to handle API requests.
- Implemented endpoints `/status` and `/stats` to check the status of Redis and MongoDB and get statistics.
- Implemented corresponding controller functions.

### 3. Create a New User
- Added an endpoint `/users` to create a new user in the database.
- Implemented validation checks for email and password.
- Hashed the password before storing it in the database.

### 4. Authenticate a User
- Added endpoints `/connect` and `/disconnect` for user authentication.
- Implemented Basic auth for user login.
- Generated authentication tokens and stored them in Redis for session management.

### 5. First File
- Added an endpoint `/files` to upload files to the system.
- Implemented file upload functionality with support for different file types.
- Stored files locally and in the database.

### 6. Get and List Files
- Added endpoints `/files/:id` and `/files` to retrieve file details and list files.
- Implemented pagination for listing files.
- Handled file retrieval based on file ID.

### 7. File Publish/Unpublish
- Added endpoints `/files/:id/publish` and `/files/:id/unpublish` to publish/unpublish files.
- Implemented functionality to update the `isPublic` attribute of files.

### 8. File Data
- Added endpoint `/files/:id/data` to retrieve file content.
- Implemented file content retrieval based on file ID.
- Handled file access permissions and MIME type detection.

### 9. Image Thumbnails
- Implemented background processing for generating thumbnails of images.
- Created a Bull queue (`fileQueue`) for thumbnail generation.
- Added endpoint `/files/:id/data` to retrieve different thumbnail sizes of images.

## Usage
- After starting the server, the API can be accessed using HTTP requests.
- Endpoints are available for user management, file upload, file retrieval, and more.
- Authentication is required for certain endpoints, which can be achieved using tokens generated during login.

## Technologies Used
- Node.js
- Express.js
- MongoDB
- Redis
- Bull
- image-thumbnail

## Contributors
- [[Christophe NGAN](https://github.com/Sirothpech)]
