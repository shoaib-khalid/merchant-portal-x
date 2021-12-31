import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { BooleanInput } from '@angular/cdk/coercion';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { User } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { store } from 'app/mock-api/common/store/data';
import { StoresService } from 'app/core/store/store.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { storeStatusComponent } from './status/status.component';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector       : 'user',
    templateUrl    : './user.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'user'
})
export class UserComponent implements OnInit, OnDestroy
{
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_showAvatar: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    @Input() showAvatar: boolean = true;
    user: User;

    selectedStatusForm: FormGroup;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _router: Router,
        private _userService: UserService,
        private _storesService: StoresService,
        private _fuseConfirmationService: FuseConfirmationService,
        public _dialog: MatDialog,
        private _formBuilder: FormBuilder
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for storeId
     */

    get storeId$(): string
    {
        return localStorage.getItem('storeId') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {

        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user: User) => {
                this.user = user;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update the user status
     *
     * @param status
     */
    updateUserStatus(status: string): void
    {
        // Return if user is not available
        if ( !this.user )
        {
            return;
        }

        // Update the user
        this._userService.update({
            ...this.user,
            status
        }).subscribe();
    }

    /**
     * Sign out
     */
    signOut(): void
    {
        this._router.navigate(['/sign-out']);
    }

    /**
     * Edit Profile
     */

    editProfile(): void
    {
        this._router.navigate(['/profile']);
    }

    goToStatusMenu(){
        
        if (this.storeId$) {
            const dialogRef = this._dialog.open(storeStatusComponent, { disableClose:true});
            dialogRef.afterClosed().subscribe((result) => {
            
                if (result.status === true) {
                    // update the status
                    this._storesService.putStoreSnooze(result).subscribe(() => {
                           
                   })
                }
                
            });
        } else (
            this._checkStoreSelected()
        )
    }

    storeSetting(): void
    {
        if (this.storeId$) {
            this._router.navigate(['/stores/edit/' + this.storeId$]);
        } else (
            this._checkStoreSelected()
        )
    }

    /**
     * Check the authenticated status
     *
     * @param redirectURL
     * @private
     */
     private _checkStoreSelected(): Observable<boolean>
     {
         // Check the authentication status
         let storeId = this._storesService.storeId$;
         
         if (!storeId) {
             // Redirect to the choose-store page
             this._router.navigate(['stores']);
 
             // Alert the user
             // alert("Please choose a store first");
 
             this._fuseConfirmationService.open({
                 "title": "No store selected",
                 "message": "Please choose a store first",
                 "icon": {
                   "show": true,
                   "name": "heroicons_outline:exclamation",
                   "color": "warn"
                 },
                 "actions": {
                   "confirm": {
                     "show": false,
                     "label": "Remove",
                     "color": "warn"
                   },
                   "cancel": {
                     "show": true,
                     "label": "OK"
                   }
                 },
                 "dismissible": false
               });
             // Prevent the access
             return of(false);
 
             
         }
 
         // Allow the access
         return of(true);
     }
}
