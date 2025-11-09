import { app } from './app';
import { config } from './config';

const PORT: number = config.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 ${config.appName} running on port ${config.env.PORT}`);
});
