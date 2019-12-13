import _ from "lodash";
import LodashDebounceDecoratorFactory from "./common/LodashDebounceDecoratorFactory";

const Debounce = LodashDebounceDecoratorFactory(_.debounce);

export default Debounce;
