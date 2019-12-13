import LodashDebounceDecoratorFactory from "./common/LodashDebounceDecoratorFactory";
import _ from "lodash";

const Throttle = LodashDebounceDecoratorFactory(_.throttle);

export default Throttle;
