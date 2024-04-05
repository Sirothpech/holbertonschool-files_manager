import express from 'express';
import bodyParser from 'body-parser';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Configurer body-parser avec une limite de taille plus grande
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Utiliser le routeur
app.use('/', router);

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
