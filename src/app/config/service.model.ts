export interface IAppConfig {
    env: {
        name: string;
    };
    apiServer: {
        flowBuilderService: string;
        userService: string;
        productService:string;
        orderService: string;
        reportService: string;
        deliveryService: string;
        paymentService: string;
        locationService: string;

    };
    storeFrontDomain:string;
    merchantPortalDomain:string;
    logging: number;
}