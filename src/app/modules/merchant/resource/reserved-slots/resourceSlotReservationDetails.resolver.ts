import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from "@angular/router";
import { ResourceService } from "app/core/resource/resource.service";
import { Resource, ResourceAvailability, ResourceSlotReservationDetails } from "app/core/resource/resource.types";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ResourceSlotReservationDetailsResolver implements Resolve<any>
{
  /**
   * Constructor
   */
  constructor(private _resourceSerivce: ResourceService) {
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Resolver
   *
   * @param route
   * @param state
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{ resourceSlotReservationDetails: ResourceSlotReservationDetails[] }> {
    return this._resourceSerivce.getAllResourceSlotReservationDetails();
  }
}

