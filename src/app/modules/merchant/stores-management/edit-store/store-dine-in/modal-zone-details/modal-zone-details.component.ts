import { ChangeDetectorRef, Component, Inject, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';
import { PlatformService } from 'app/core/platform/platform.service';
import { Platform } from 'app/core/platform/platform.types';
import { DOCUMENT } from '@angular/common';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { CartService } from 'app/core/cart/cart.service';
import { AuthService } from 'app/core/auth/auth.service';
import { JwtService } from 'app/core/jwt/jwt.service';
import { Cart, CartItem, CustomerCart } from 'app/core/cart/cart.types';
import { Store } from 'app/core/store/store.types';
import { StoresService } from 'app/core/store/store.service';
import { AppConfig } from 'app/config/service.config';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModalTypes } from '../store-dine-in.component';
import { ZoneTable } from 'app/core/location-service/location.types';

@Component({
    selector     : 'modal-zone-details',
    templateUrl  : './modal-zone-details.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class ZoneDetailsModalComponent implements OnInit, OnDestroy
{

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    zoneFormGroup = this._formBuilder.group({
        zoneName     : ['', Validators.required],
        prefix       : [''],   
        tableNoStart : [1, [Validators.required, Validators.pattern(/^\d+$/)]],
        tableNoEnd   : ['', [Validators.required, Validators.pattern(/^\d+$/)]],
        combinations : ['']
    });

    toCreate: ModalTypes;
    existingZones: string[] = [];

    /**
     * Constructor
     */
    constructor(
        @Inject(DOCUMENT) private _document: Document,
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<ZoneDetailsModalComponent>,
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _storesService: StoresService

    )
    {
        this.toCreate = data.toCreate ? data.toCreate : ModalTypes.CREATE;
        this.existingZones = data.zones ? data.zones : [];
        
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {

        if (this.toCreate === ModalTypes.EDIT_ZONE) {
            this.zoneFormGroup.get('zoneName').patchValue(this.data.currentZoneName);
            // Set to enable save button
            this.zoneFormGroup.get('tableNoStart').patchValue(1);
            this.zoneFormGroup.get('tableNoEnd').patchValue(2);

            // Then disable to enable save button
            this.zoneFormGroup.get('tableNoStart').disable();
            this.zoneFormGroup.get('tableNoEnd').disable();
            this.zoneFormGroup.get('prefix').disable();

            this.zoneFormGroup.updateValueAndValidity();
        }

        else if (this.toCreate === ModalTypes.EDIT_TABLE) {

            const zone: ZoneTable = this.data.currentZone;
            const tableIndex = zone.tagTables.findIndex(table => table.combinationTableNumber === this.data.currentTableNo);

            if (tableIndex > -1) {
                this.zoneFormGroup.get('zoneName').patchValue(zone.zoneName);
                this.zoneFormGroup.get('prefix').patchValue(zone.tagTables[tableIndex].tablePrefix);
                this.zoneFormGroup.get('tableNoStart').patchValue(zone.tagTables[tableIndex].tableNumber);
            }

            // Update validator
            this.zoneFormGroup.get('tableNoStart').setValidators([Validators.required]);
            // Disable to enable save button
            this.zoneFormGroup.get('tableNoEnd').clearValidators();
            this.zoneFormGroup.get('tableNoEnd').disable();

            this.zoneFormGroup.updateValueAndValidity();
        }

        else if (this.toCreate === ModalTypes.ADD_TABLE) {

            const zone: ZoneTable = this.data.currentZone;

            this.zoneFormGroup.get('zoneName').patchValue(zone.zoneName);
            this.zoneFormGroup.get('tableNoStart').patchValue('');
            // Update validator
            this.zoneFormGroup.get('tableNoStart').setValidators([Validators.required]);
            // Disable to enable save button
            this.zoneFormGroup.get('tableNoEnd').clearValidators();
            this.zoneFormGroup.get('tableNoEnd').disable();

            this.zoneFormGroup.updateValueAndValidity();
        }
        
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    
    save() {
        this.dialogRef.close({
            saved: true,
            value: this.zoneFormGroup.value
        });
    }

    closeDialog() {
        this.dialogRef.close({
            saved: false
        });
    }

    checkZoneName(value: string) {

        if (this.existingZones.includes(value)) {
            this.zoneFormGroup.get('zoneName').setErrors({zoneNameExists: true});

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }
        
    }

    checkTableNo(value: string, type: string) {

        const zone: ZoneTable = this.data.currentZone;

        if (type === 'prefix') {
            this.zoneFormGroup.get('prefix').patchValue(value);
        }
        else if (type === 'tableNoStart') {
            this.zoneFormGroup.get('tableNoStart').patchValue(value);
        }

        const combiTableNo = this.zoneFormGroup.get('prefix').value + this.zoneFormGroup.get('tableNoStart').value;
        
        // Set error
        if (zone.tagTables.map(x => x.combinationTableNumber).includes(combiTableNo)) {
            this.zoneFormGroup.get('combinations').setErrors({nameExists: true});
        }
        // Remove error
        else {
            this.zoneFormGroup.get('combinations').reset();
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

}
