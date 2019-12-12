import http from "http";

export default function Timer(target: any, propertyName: string, propertyDescriptor: PropertyDescriptor) {
    const method = propertyDescriptor.value;
    propertyDescriptor.value = function (...args: any[]) {
        const httpRequest: any = args[0];
        let child: any;
        const useOpenTracing: boolean = httpRequest instanceof http.ClientRequest;
        if (useOpenTracing) {
            // @ts-ignore
            child = httpRequest.tracer.startSpan(`${target.constructor.name}.${propertyName}`, {childOf: httpRequest.parentSpan});
        }
        const startTimeMill = Date.now();
        const response = method.apply(this, args);
        const endTimeMill = Date.now();
        console.log(`Method: ${propertyName} used ${endTimeMill - startTimeMill}ms.`);
        if (useOpenTracing) {
            child.finish(httpRequest);
        }
        return response;
    }
}
