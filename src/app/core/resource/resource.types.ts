import { Product } from "../product/inventory.types";

export interface Resource{
    id?: string;
    name?: string;
    productId?: string;
    numberOfWeeksReservable: number;
    price: number;
    status: string;
    resourceProduct?: Product;
}
export interface ResourcePagination
{
    length: number;
    size: number;
    page: number;
    lastPage: number;
    startIndex: number;
    endIndex: number;
}

export interface ResourceAvailability{
    id?: string;
    storeId?: string;
    resourceId?: string;
    availabilityDay: string;
    startTime: string;
    endTime: string;
    offsetHours: string;
    durationInMinutes: number;
    minimumTimeBetweenReservation?: number;
    confirmationMethod?: string;
    description?: string;

}

export interface ResourceSlotReservation{
    id?: string;
    resourceAvailabilityId: string;
    date: string;
    startTimeInMillisecondsUTC: number;
    endTimeInMillisecondsUTC: number;
    startTimeInHours: string;
    endTimeInHours: string;
    isReserved?: boolean;
    durationInMinutes: number;
}

export interface ResourceSlotReservationDetails{
    id?: string;
    customerName: string;
    customerEmail: string;
    customerPhoneNumber: string;
    status: string;
    customerNotes?: string;
    customerId?: string;
    resourceSlotReservation: ResourceSlotReservation;
}