import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AddProductComponent2 } from './product-details/add-product/add-product.component';

@Injectable({
    providedIn: 'root'
})
export class CanDeactivateAddInventory implements CanDeactivate<AddProductComponent2>
{
    canDeactivate(
        component: AddProductComponent2,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        // Get the next route
        let nextRoute: ActivatedRouteSnapshot = nextState.root;
        while ( nextRoute.firstChild )
        {
            nextRoute = nextRoute.firstChild;
        }

        // If the next state doesn't contain '/addon'
        // it means we are navigating away from the
        // addon app
        if ( !nextState.url.includes('/inventory') )
        {
            // Let it navigate
            return true;
        }

        // If we are navigating to another addon...
        if ( nextRoute.paramMap.get('id') )
        {
            // Just navigate
            return true;
        }
        // Otherwise...
        else
        {
            // Close the drawer first, and then navigate
            return component.closeDrawer().then(() => true);
        }
    }
}
