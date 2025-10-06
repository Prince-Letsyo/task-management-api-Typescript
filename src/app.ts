import { log } from 'console';
import express from 'express';
export const app = express();

app.use(express.json());
app.get('/', (req, res) => {
  log(req);
  log(res);
  res.send('Hello, World!');
});
