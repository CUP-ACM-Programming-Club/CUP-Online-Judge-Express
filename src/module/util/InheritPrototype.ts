function inheritPrototype(subType: any, superType: any){
	const prototype = Object.create(superType.prototype); // 创建对象，创建父类原型的一个副本
	prototype.constructor = subType;                    // 增强对象，弥补因重写原型而失去的默认的constructor 属性
	subType.prototype = prototype;                      // 指定对象，将新创建的对象赋值给子类的原型
}

module.exports = inheritPrototype;
