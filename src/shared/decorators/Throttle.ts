import LodashDebounceDecoratorFactory from "./LodashDebounceDecoratorFactory";
import _ from "lodash";

const Throttle = LodashDebounceDecoratorFactory(_.throttle);

export default Throttle;
