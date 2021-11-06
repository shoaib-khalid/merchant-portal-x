import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector     : 'choose-country',
    templateUrl  : './choose-country.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ChooseCountryComponent implements OnInit
{

    isCountrySelected: boolean = true;
    country: string = null;

    /**
     * Constructor
     */
    constructor(
        public matDialogRef: MatDialogRef<ChooseCountryComponent>,
        private _changeDetectorRef: ChangeDetectorRef,
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    changeCountry(countryId){
        if (countryId && countryId !== null) {
            this.country = countryId;
            this.isCountrySelected = false;
        }
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Send the message
     */
    setCountry(): void
    {
        if (this.country && this.country !== null){
            this.matDialogRef.close(this.country);
        }
    }
}
