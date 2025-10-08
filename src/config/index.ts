import { ConfigService } from "./service";

const configService = ConfigService.getInstance();
export const config = configService.all();


