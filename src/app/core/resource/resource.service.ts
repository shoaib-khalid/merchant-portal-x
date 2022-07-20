import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from 'app/config/service.config';
import { products } from 'app/mock-api/apps/ecommerce/inventory/data';
import { BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError } from 'rxjs';
import { LogService } from '../logging/log.service';
import { ApiResponseModel } from '../product/inventory.types';
import { Resource, ResourceAvailability, ResourcePagination, ResourceSlotReservation, ResourceSlotReservationDetails } from './resource.types';

@Injectable({
	providedIn: 'root'
})
export class ResourceService {

	private _resource: BehaviorSubject<Resource | null> = new BehaviorSubject(null);
	private _resources: BehaviorSubject<Resource[]> = new BehaviorSubject(null);
	private _pagination: BehaviorSubject<ResourcePagination | null> = new BehaviorSubject(null);

	private _resourceAvailability: BehaviorSubject<ResourceAvailability | null> = new BehaviorSubject(null);
	private _resourceAvailabilities: BehaviorSubject<ResourceAvailability[]> = new BehaviorSubject(null);
	private _resourceAvailabilitiesByResource: BehaviorSubject<ResourceAvailability[]> = new BehaviorSubject(null);

	private _resourceSlotReservation: BehaviorSubject<ResourceSlotReservation | null> = new BehaviorSubject(null);
	private _resourceSlotReservations: BehaviorSubject<ResourceSlotReservation[]> = new BehaviorSubject(null);

	private _resourceSlotReservationDetail: BehaviorSubject<ResourceSlotReservationDetails | null> = new BehaviorSubject(null);
	private _resourceSlotReservationDetails: BehaviorSubject<ResourceSlotReservationDetails[]> = new BehaviorSubject(null);



	constructor(
		private _httpClient: HttpClient,
		private _apiServer: AppConfig,
		private _logging: LogService,
	) {

	}

	/**
	* Getter for storeId
	*/
	get storeId$(): string {
		return localStorage.getItem('storeId') ?? '';
	}

	/**
	 * Getter for resource
	 */
	get resource$(): Observable<Resource> { return this._resource.asObservable(); }

	/**
	 * Getter for resources
	 */
	get resources$(): Observable<Resource[]> { return this._resources.asObservable(); }

	/**
	 * Getter for resource availability
	 */
	get resourceAvailability$(): Observable<ResourceAvailability> { return this._resourceAvailability.asObservable(); }

	/**
	 * Getter for resource availabilities
	 */
	get resourceAvailabilities$(): Observable<ResourceAvailability[]> { return this._resourceAvailabilities.asObservable(); }

	/**
	 * Getter for resource slot reservation
	 */
	get resourceSlotReservation$(): Observable<ResourceSlotReservation | null> { return this._resourceSlotReservation.asObservable(); }

	/** 
	 * Getter for resource slot reservations
	*/
	get resourceSlotReservations$(): Observable<ResourceSlotReservation[]> { return this._resourceSlotReservations.asObservable(); }

	/** 
	 * Getter for resource slot reservation detail
	*/
	get resourceSlotReservationDetail$(): Observable<ResourceSlotReservationDetails | null> { return this._resourceSlotReservationDetail.asObservable(); }

	/**
	 * Getter for resource slot reservation details
	 */
	get resourceSlotReservationDetails$(): Observable<ResourceSlotReservationDetails[] | null> { return this._resourceSlotReservationDetails.asObservable(); }



	/**
	 * Create Resource
	 */
	createResource(resourceBody: Resource, storeId: string, productId: string): Observable<Resource> {
		return this.resources$.pipe(
			take(1),
			switchMap(resources => this._httpClient.post<Resource>(`https://api.symplified.it/services-vertical-service/v1/resources/?storeId=${storeId}&productId=${productId}`, resourceBody).pipe(
				map((newResource) => {

					this._logging.debug("Response from ServiceVertical (createResource) - Before ", newResource);

					let _newResource = newResource["data"];

					this._logging.debug("Response from ServiceVertical (createResource) - After", _newResource);

					// Update the resources with the new resource
					this._resources.next([_newResource, ...resources]);

					// Return the new Resource
					return newResource;
				})
			))
		);
	}

	/**
	* Delete the Resource
	*
	* @param id
	*/
	deleteResource(resourceId: string): Observable<boolean> {

		return this.resources$.pipe(
			take(1),
			switchMap(resources => this._httpClient.delete(`https://api.symplified.it/services-vertical-service/v1/resources/?storeId=${this.storeId$}&resourceId=${resourceId}`).pipe(
				map((status: number) => {

					// Find the index of the deleted resource
					const index = resources.findIndex(item => item.id === resourceId);

					// Delete the resource
					resources.splice(index, 1);

					// Update the resources
					this._resources.next(resources);

					let isDeleted: boolean = false;
					if (status === 200) {
						isDeleted = true
					}

					// Return the deleted status
					return isDeleted;
				})
			))
		);
	}

	/**
	* Delete the Resource
	*
	* @param id
	*/
	deleteResourceAvailability(resourceAvailabilityId: string): Observable<boolean> {

		return this.resourceAvailabilities$.pipe(
			take(1),
			switchMap(resourceAvailability => this._httpClient.delete(`https://api.symplified.it/services-vertical-service/v1/resources/availabilities/?storeId=${this.storeId$}&resourceAvailabilityId=${resourceAvailabilityId}`).pipe(
				map((response) => {

					let isDeleted: boolean = false;
					if (response["status"] === 200) {
						isDeleted = true
					}

					// Return the deleted status
					return isDeleted;
				})
			))
		);
	}
	deleteResourceSlotReservationDetails(resourceSlotReservationDetailsId: string): Observable<boolean> {

		return this.resourceSlotReservationDetails$.pipe(
			take(1),
			switchMap(resourceSlotReservationDetails => this._httpClient.delete(`https://api.symplified.it/services-vertical-service/v1/resources/slots/reservations/?storeId=${this.storeId$}&resourceSlotReservationDetailId=${resourceSlotReservationDetailsId}`).pipe(
				map((response) => {

					let isDeleted: boolean = false;
					if (response["status"] === 200) {
						isDeleted = true
					}

					// Return the deleted status
					return isDeleted;
				})
			))
		);
	}

	getResourcesById(id: string): Observable<Resource> {
		return this._resources.pipe(
			take(1),
			map((resources) => {

				// Find the resource
				const resource = resources.find(item => item.id === id) || null;

				this._logging.debug("Response from ServiceVertical (Current Resource)", resource);

				// Update the resource
				this._resource.next(resource);

				// Return the resource
				return resource;
			}),
			switchMap((resource) => {

				if (!resource) {
					return throwError('Could not found resource with id of ' + id + '!');
				}

				return of(resource);
			})
		);
	}

	/**
	 * Get resource by ID by calling API
	 * 
	 * @param resourceId 
	 * @returns 
	 */
	getResourceById(resourceId: string): Observable<Resource> {


		return this._httpClient.get<Resource>(`https://api.symplified.it/services-vertical-service/v1/resources/find/?storeId=${this.storeId$}&resourceId=${resourceId}`).pipe(
			tap((response) => {

				this._logging.debug("Response from ServiceVertical (getResourceById)", response);

				// Update the product
				this._resource.next(response["data"]);

			})
		);

	}

	getResourceByIdResponse(resourceId: string): Observable<ApiResponseModel<Resource>> {
		let response = this._httpClient.get<ApiResponseModel<Resource>>(`https://api.symplified.it/services-vertical-service/v1/resources/find/?storeId=${this.storeId$}&resourceId=${resourceId}`);
		this._logging.debug("Response from ServiceVertical (getResourceByIdResponse)", response);

		return response;
	}

	getResourceSlotReservationsByIdResponse(): Observable<ApiResponseModel<ResourceSlotReservation>> {
		let response = this._httpClient.get<ApiResponseModel<ResourceSlotReservation>>(`https://api.symplified.it/services-vertical-service/v1/resources/slots/reserved?storeId=${this.storeId$}`);
		this._logging.debug("Response from ServiceVertical (getResourceSlotReservations)", response);

		return response;
	}



	/**
	 * Update resource
	 *
	 * @param resourceId
	 * @param resource
	 */
	updateResource(resourceId: string, resource: Resource): Observable<Resource> {
		return this.resources$.pipe(
			take(1),
			switchMap(resources => this._httpClient.put<Resource>(`https://api.symplified.it/services-vertical-service/v1/resources/?storeId=${this.storeId$}&resourceId=${resourceId}`, resource).pipe(
				map((updatedResource) => {

					this._logging.debug("Response from ServiceVertical (updateResource)", updatedResource);

					// Find the index of the updated resource
					const index = resources.findIndex(item => item.id === resourceId);

					// Update the resource
					resources[index] = { ...resources[index], ...updatedResource["data"] };

					// Update the resources
					this._resources.next(resources);

					console.log('updatedResource: ', updatedResource);

					// Return the updated resource
					return updatedResource["data"];
				}),
				switchMap(updatedResource => this.resource$.pipe(
					take(1),
					filter(item => item && item.id === resourceId),
					tap(() => {

						// Update the resource if it's selected
						this._resource.next(updatedResource["data"]);

						// Return the updated resource
						return updatedResource["data"];
					})
				))
			))
		);
	}


	/**
	 * Update resource availability
	 *
	 * @param resourceId
	 * @param resource
	 */
	updateResourceAvailability(resourceAvailabilityId: string, resourceAvailability: ResourceAvailability): Observable<ResourceAvailability> {
		return this.resourceAvailabilities$.pipe(
			take(1),
			switchMap(resourceAvailabilities => this._httpClient.put<ResourceAvailability>(`https://api.symplified.it/services-vertical-service/v1/resources/availabilities/?storeId=${this.storeId$}&resourceAvailabilityId=${resourceAvailabilityId}`, resourceAvailability).pipe(
				map((updatedResourceAvailability) => {

					this._logging.debug("Response from ServiceVertical (updateResource)", updatedResourceAvailability);

					// Find the index of the updated resource
					const index = resourceAvailabilities.findIndex(item => item.id === resourceAvailabilityId);

					// Update the resource
					resourceAvailabilities[index] = { ...resourceAvailabilities[index], ...updatedResourceAvailability["data"] };

					// Update the resources
					this._resourceAvailabilities.next(resourceAvailabilities);

					console.log('updatedResource: ', updatedResourceAvailability);

					// Return the updated resource
					return updatedResourceAvailability["data"];
				}),
				switchMap(updatedResourceAvailability => this.resourceAvailability$.pipe(
					take(1),
					filter(item => item && item.id === resourceAvailabilityId),
					tap(() => {

						// Update the resource if it's selected
						this._resourceAvailability.next(updatedResourceAvailability["data"]);

						// Return the updated resource
						return updatedResourceAvailability["data"];
					})
				))
			))
		);
	}



	getAllResources(): Observable<{ resources: Resource[] }> {


		return this._httpClient.get<any>(`https://api.symplified.it/services-vertical-service/v1/resources/?storeId=${this.storeId$}`).pipe(
			tap((response) => {

				this._logging.debug("Response from ServiceVertical", response);

				this._resources.next(response.data);
			})
		);
	}

	/**
	 * Create Resource Availability
	 */
	createResourceAvailability(resourceAvailabilityBody: ResourceAvailability, storeId: string, resourceId: string): Observable<ResourceAvailability> {
		return this.resourceAvailabilities$.pipe(
			take(1),
			switchMap(resourceAvailability => this._httpClient.post<any>(`https://api.symplified.it/services-vertical-service/v1/resources/availabilities/?storeId=${storeId}&resourceId=${resourceId}`, resourceAvailabilityBody
			).pipe(
				map((newResourceAvailability) => {

					return newResourceAvailability;
				})
			))
		);
	}

	getAllResourceAvailabilites(): Observable<{ resourceAvailabilites: ResourceAvailability[] }> {


		return this._httpClient.get<any>(`https://api.symplified.it/services-vertical-service/v1/resources/availabilities/?storeId=${this.storeId$}`).pipe(
			tap((response) => {

				this._logging.debug("Response from ServiceVertical", response);

				this._resourceAvailabilities.next(response.data);
			})
		);
	}


	getAllResourceAvailabilitesByResource(resourceId: string): Observable<{ resourceAvailabilites: ResourceAvailability[] }> {

		return this._httpClient.get<any>(`https://api.symplified.it/services-vertical-service/v1/resources/availabilities/get-by-resource/?storeId=${this.storeId$}&resourceId=${resourceId}`).pipe(
			tap((response) => {

				this._logging.debug("Response from ServiceVertical", response);

				this._resourceAvailabilities.next(response.data);
			})
		);
	}


	getAllResourceSlotReservationDetails(): Observable<{ resourceSlotReservationDetails: ResourceSlotReservationDetails[] }> {


		return this._httpClient.get<any>(`https://api.symplified.it/services-vertical-service/v1/resources/slots/reservations?storeId=${this.storeId$}`).pipe(
			tap((response) => {

				this._logging.debug("Response from ServiceVertical", response);
				this._resourceSlotReservationDetails.next(response.data);
			})
		);
	}

	getSlots(): any {
		return this._httpClient.get<any>(`https://api.symplified.it/services-vertical-service/v1/resources/slots/reservations?storeId=${this.storeId$}`);
	}

	setResourceDayOff(resourceAvailabilityId: string, date: string): Observable<ResourceAvailability> {
		return this.resourceAvailabilities$.pipe(
			take(1),
			switchMap(resourceSlotReservation => this._httpClient.post<any>(`https://api.symplified.it/services-vertical-service/v1/resources/slots/offday/?storeId=${this.storeId$}&resourceAvailabilityId=${resourceAvailabilityId}&date=${date}`, '').pipe(
				map((newResourceSlotReservation) => {

					return newResourceSlotReservation;
				})
			))
		);
	}

}
