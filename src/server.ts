import { app } from "./app";
import { config } from "./config/index"

const PORT: number = config.env.PORT

app.listen(PORT, () => {
  console.log(`🚀 ${config.appName} running on port ${config.env.PORT}`);
});
