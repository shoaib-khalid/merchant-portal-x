export interface IAppConfig {
    env: {
        name: string;
    };
    apiServer: {
        flowBuilderService: string;
        userService: string;
        productService:string;
        orderService:string;
        reportService:string;
        deliveryService:string;
        paymentService:string;

    };
    storeFrontDomain:string;
    logging: number;
}