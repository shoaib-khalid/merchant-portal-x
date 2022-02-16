import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { LocaleService } from 'app/core/locale/locale.service';
import { LogService } from 'app/core/logging/log.service';
import { StoresService } from 'app/core/store/store.service';
import { map, mergeMap, switchMap, tap } from 'rxjs/operators';

@Component({
    selector     : 'app-shared-background',
    templateUrl  : './shared-background.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class SharedBackgroundComponent implements OnInit
{
    image: any=[];
    countryCode:string='';
    
    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: FormBuilder,
        private _router: Router,
        private _storesService:StoresService,
        private _localeService:LocaleService,

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

        this._localeService.get()
        .pipe(
            map((resp)=>{
                if(resp.status === "success" && (resp.countryCode === 'MY' || resp.countryCode === 'PK')){

                    this.countryCode = resp.countryCode === 'MY'?'MYS':resp.countryCode === 'PK'?'PAK':null;
   
                } else{
                    this.countryCode = 'MYS';//ELSE WE RETURN DEFAULT
                }
   
                return this.countryCode;
            }),
            switchMap(countryCode=>this._storesService.getStoreTop(countryCode)),

        )
        .subscribe((resp)=>{
            this.image = resp.topStoreAsset;

        })

      
    }



}