import express from 'express';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Utiliser le routeur
app.use('/', router);

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
