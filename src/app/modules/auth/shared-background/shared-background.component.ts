import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector     : 'app-shared-background',
    templateUrl  : './shared-background.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class SharedBackgroundComponent implements OnInit
{
    image: any[]=[]

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _storesService:StoresService,
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        //need to call service for get the latest merchant registered

        //temporary only
        // this._storesService.getStores().subscribe((response)=>
        // {
        //     console.log("Checking RESPONSE:::",response);
            
        // });

    
    }


}
