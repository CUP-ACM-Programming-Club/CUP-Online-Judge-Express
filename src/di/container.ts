import { Container } from "inversify";
import { TYPES } from "./types";
import { ConfigService } from "../service/ConfigService";

const container = new Container();
container.bind<ConfigService>(TYPES.ConfigService).to(ConfigService).inSingletonScope();

export { container };
