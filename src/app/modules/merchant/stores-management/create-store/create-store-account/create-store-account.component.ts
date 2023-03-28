import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoresService } from 'app/core/store/store.service';
import { ChooseVerticalService } from '../../choose-vertical/choose-vertical.service';
import { EditStoreValidationService } from 'app/modules/merchant/stores-management/edit-store/edit-store.validation.service';
import { Store, StoreRegionCountries } from 'app/core/store/store.types';
import { debounce } from 'lodash';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { debounceTime, switchMap, takeUntil, tap } from 'rxjs/operators';
import { lastValueFrom, Subject } from 'rxjs';
import { UserService } from 'app/core/user/user.service';
import { Client } from 'app/core/user/user.types';
import { MatDialog } from '@angular/material/dialog';
import { RegisterStoreValidationService } from '../../register-store/register-store.validation.service';

@Component({
    selector       : 'create-store-account',
    templateUrl    : './create-store-account.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateStoreAccountComponent implements OnInit
{
    storeAccountForm: FormGroup;
    verticalCode: string = '';
    /** Domain details */
    fullDomain: string;
    domainName: string = '';
    subDomainName: string;

    regionCountryStateId: string = '';
    postcode: string = '';
    dialingCode: string;
    city: string = '';

    // Fuse Media Watcher
    currentScreenSize: string[] = [];

    customDomain: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    client: Client;
    storeId: string = '';
    storeCreationError: boolean = false;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _route: ActivatedRoute,
        private _storesService: StoresService,
        private _chooseVerticalService: ChooseVerticalService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _userService: UserService,
        private _router: Router,
        private _matDialog: MatDialog
    )
    {
        // this.checkExistingURL = debounce(this.checkExistingURL, 300);
        // this.checkExistingName = debounce(this.checkExistingName,300);
        this.verticalCode = this._route.snapshot.paramMap.get('vertical-code');

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the form
        this.storeAccountForm = this._formBuilder.group({
            name                : ['', Validators.required],
            subdomain           : ['', [Validators.required, Validators.minLength(4), Validators.maxLength(63), EditStoreValidationService.domainValidator]],
            email               : ['', [Validators.required, Validators.email]],
            paymentType         : [{value: 'ONLINEPAYMENT', disabled: true}],
            storePrefix         : [''],
            phoneNumber         : ['', [RegisterStoreValidationService.phonenumberValidator, Validators.minLength(5), Validators.maxLength(30)]],
        });
        
        if (this.verticalCode) {
            this._chooseVerticalService.getVerticalById(this.verticalCode)
                .subscribe((response) => {
                    this.domainName = "." + response.domain;
                });
        }

        // Subscribe to the user service
        this._userService.client$
            .pipe((takeUntil(this._unsubscribeAll)))
            .subscribe((client: Client) => {
                this.client = client;
                
                let countryId = client.countryId;
                    switch (countryId) {
                        case 'MYS':
                            this.dialingCode = '+60';
                            this.regionCountryStateId = 'KualaLumpur';
                            this.postcode = '50000';
                            this.city = 'KualaLumpur';
                            
                            break;
                        case 'PAK':
                            this.dialingCode = '+92';
                            this.regionCountryStateId = 'Federal';
                            this.postcode = '44000';
                            this.city = 'ISLAMABAD';

                            break;
                        default:
                            break;
                    }

                this.storeAccountForm.get('email').patchValue(client.email);
                // Mark for check
                this._changeDetectorRef.markForCheck();

            });


        // Fuse Media Watcher Service
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {               

                this.currentScreenSize = matchingAliases;                

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this.storeAccountForm.get('name').valueChanges
            .pipe(
                debounceTime(500),
                takeUntil(this._unsubscribeAll),
                tap(async name => {
                    let status = await this._storesService.getExistingName(name);
                    let transformed = name.replace(/[^\w-]+/g, '').toLowerCase();

                    if (status === 409){
                        transformed = '';
                        setTimeout(() => {
                            this.storeAccountForm.get('name').setErrors({storeNameAlreadyTaken: true});
                            this.storeAccountForm.get('name').markAsTouched({onlySelf: true});
            
                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        }, 0);
                    }
                    else if (status === 200) {
            
                        this._storesService.generateStorePrefix({name})
                            .subscribe(
                                {
                                    next: (prefix) => {
                                        if (prefix) {
                                            this.storeAccountForm.get('storePrefix').patchValue(prefix);
                    
                                            // Mark for check
                                            this._changeDetectorRef.markForCheck();
                                        }
                                    },
                                    error: (err) => {
                                        // Show a failed message (it can also be an error message)
                                        this._fuseConfirmationService.open({
                                            title  : err.error.error ? err.error.error : 'Error',
                                            message: err.error.message ? err.error.message : err.message,
                                            icon: {
                                                show: true,
                                                name: "heroicons_outline:exclamation",
                                                color: "warn"
                                            },
                                            actions: {
                                                confirm: {
                                                    label: 'OK',
                                                    color: "primary",
                                                },
                                                cancel: {
                                                    show: false,
                                                },
                                            }
                                        });
                                    }
                                }
                            )
                    }

                    this.storeAccountForm.get('subdomain').patchValue(transformed);

                })
                )
            .subscribe()

        this.storeAccountForm.get('subdomain').valueChanges
        .pipe(
            debounceTime(500),
            takeUntil(this._unsubscribeAll),
            tap(async subdomain => {
                if (subdomain === '') return;
                if (subdomain.substring(0, 1) === '.') return;

                let url = this.customDomain ? subdomain : subdomain + this.domainName;
                let status = await this._storesService.getExistingURL(url);
                if (status === 409 && this.fullDomain !== url){
                    setTimeout(() => {
                        this.storeAccountForm.get('subdomain').setErrors({domainAlreadyTaken: true});
                        this.storeAccountForm.get('subdomain').markAsTouched({onlySelf: true});

                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }, 0);
                }

            })
            )
        .subscribe()

        // Mark for check
        this._changeDetectorRef.markForCheck();
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

    sanitizePhoneNumber(phoneNumber: string) {

        let substring = phoneNumber.substring(0, 1)
        let countryId = this.client.regionCountry.id;
        let sanitizedPhoneNo = ''
        
        if ( countryId === 'MYS' ) {

                 if (substring === '6') sanitizedPhoneNo = phoneNumber;
            else if (substring === '0') sanitizedPhoneNo = '6' + phoneNumber;
            else if (substring === '+') sanitizedPhoneNo = phoneNumber.substring(1);
            else                        sanitizedPhoneNo = '60' + phoneNumber;

        }
        else if ( countryId === 'PAK') {

                 if (substring === '9') sanitizedPhoneNo = phoneNumber;
            else if (substring === '2') sanitizedPhoneNo = '9' + phoneNumber;
            else if (substring === '+') sanitizedPhoneNo = phoneNumber.substring(1);
            else                        sanitizedPhoneNo = '92' + phoneNumber;

        }

        return sanitizedPhoneNo;
    }

    
    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    updateStoreAccount(){

        // this will remove the item from the object
        const { subdomain,...storeAccountBody } = this.storeAccountForm.getRawValue();
    
        // add domain when sending to backend.. at frontend form call it subdomain
        storeAccountBody["domain"] = this.customDomain ? subdomain : subdomain + this.domainName;
        storeAccountBody["clientId"] = this.client.id;
        storeAccountBody["isBranch"] = false;
        storeAccountBody["isSnooze"] = false;
        storeAccountBody["serviceChargesPercentage"] = 0;
        storeAccountBody["verticalCode"] = this.verticalCode;
        storeAccountBody["address"] = '';
        storeAccountBody["city"] = this.city ? this.city : 'KualaLumpur';
        storeAccountBody["regionCountryId"] = this.client.regionCountry.id;
        storeAccountBody["postcode"] = this.postcode ? this.postcode : '5000';
        storeAccountBody["regionCountryStateId"] = this.regionCountryStateId ? this.regionCountryStateId : 'KualaLumpur';
        storeAccountBody["latitude"] = '';
        storeAccountBody["longitude"] = '';
        storeAccountBody["paymentType"] = 'ONLINEPAYMENT';
        storeAccountBody["storeDescription"] = '';

        // Disable the form
        this.storeAccountForm.disable({onlySelf:true, emitEvent: false});
        
        this._storesService.post(storeAccountBody)
            .subscribe({
                next: async (response) => {

                    this.storeId = response['data'].id;
                    this._storesService.store = response['data'];
                    this._storesService.storeId = response['data'].id;
                    this.storeCreationError = false;

                    // ---------------------------
                    //    Create Store Timing
                    // --------------------------- 
                    await this.createStoreTiming()
                        .then(result => { })
                        .catch(err => { 
                            console.error('FAILED [create store timing]- ', err);
                            this.storeCreationError = true;
                        })


                    // ---------------------------
                    //    Create Store Provider
                    // ---------------------------
                    let deliveryType = '';
                    // Hardcode
                    if (this.verticalCode === "E-Commerce" || this.verticalCode === "e-commerce-b2b2c" || this.verticalCode === "ECommerce_PK") {
                        deliveryType = 'SCHEDULED';
                    }
                    else {
                        deliveryType = 'ADHOC';
                    }
                    await this.createStoreProvider(deliveryType, true)
                        .then(result => {
                        })
                        .catch(err => { 
                            console.error('FAILED [create store provider]- ', err);
                            this.storeCreationError = true;
                        })


                    await this.storeCreationStatus(this.storeCreationError);

                },
                error: (error) => {

                    // After close Confirmation Dialog from core interceptor
                    this._matDialog.afterAllClosed.subscribe(() => {
                        // Navigate to stpre management
                        // this._router.navigate(['/stores']);

                        // Enable the form except payment type
                        this.storeAccountForm.enable({emitEvent: false});
                        this.storeAccountForm.get('paymentType').disable();
                    })

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                }
            })
    }

    async createStoreTiming() {
        let promise = new Promise(async (resolve, reject) => {

            let error = false;

            // Hardcode store timing
            const timingArray = [
                { day: "Monday", openTime: "09:00", closeTime: "23:00", breakStartTime: null, breakEndTime: null,  isOff: true, isOpen: true, isBreakTime: true, storeId: this.storeId },
                { day: "Tuesday", openTime: "09:00", closeTime: "23:00", breakStartTime: null, breakEndTime: null,  isOff: true, isOpen: true, isBreakTime: true, storeId: this.storeId },
                { day: "Wednesday", openTime: "09:00", closeTime: "23:00", breakStartTime: null, breakEndTime: null,  isOff: true, isOpen: true, isBreakTime: true, storeId: this.storeId },
                { day: "Thursday", openTime: "09:00", closeTime: "23:00", breakStartTime: null, breakEndTime: null,  isOff: true, isOpen: true, isBreakTime: true, storeId: this.storeId },
                { day: "Friday", openTime: "09:00", closeTime: "23:00", breakStartTime: null, breakEndTime: null,  isOff: true, isOpen: true, isBreakTime: true, storeId: this.storeId },
                { day: "Saturday", openTime: "09:00", closeTime: "23:00", breakStartTime: null, breakEndTime: null,  isOff: true, isOpen: false, isBreakTime: true, storeId: this.storeId },
                { day: "Sunday", openTime: "09:00", closeTime: "23:00", breakStartTime: null, breakEndTime: null,  isOff: true, isOpen: false, isBreakTime: true, storeId: this.storeId },
            ];
            

            // ---------------------------
            //    Create Store Timing
            // ---------------------------

            await lastValueFrom(this._storesService.postTimingBulk(this.storeId, timingArray))
                .catch(err => {
                    reject('Error in postTiming')
                    error = true;
                })

            resolve("done")
        });
        return promise;
    }

    async createStoreProvider(deliveryType: string, allowStorePickup: boolean) {
        let promise = new Promise(async (resolve, reject) => {
            let error = false;
            let _itemType = '';
            let _deliveryType = '';
            if (this.verticalCode === "E-Commerce" || this.verticalCode === "e-commerce-b2b2c" || this.verticalCode === "ECommerce_PK") {
                // this is actually handled by front end (but incase of hacking)
                if (deliveryType === "SELF") { 
                    _itemType = null;
                    _deliveryType = deliveryType;
                } else {
                    _itemType = "PARCEL";
                    _deliveryType = "SCHEDULED";
                    console.warn("E-Commerce deliveryType should be SCHEDULED. Current selected deliveryType " + deliveryType) 
                } 
            } else if (this.verticalCode === "FnB" || this.verticalCode === "FnB_PK") {
                // this is actually handled by front end (but incase of hacking)
                if (deliveryType === "SELF") { 
                    _itemType = null;
                    _deliveryType = deliveryType;
                } else {
                    _itemType = "FOOD";
                    _deliveryType = "ADHOC";
                    console.warn("E-Commerce deliveryType should be ADHOC. Current selected deliveryType " + deliveryType) 
                } 
            } else {
                _itemType = null;
                _deliveryType = "SELF";
            }
    
            const deliveryDetailBody = {
                allowsStorePickup: allowStorePickup,
                itemType: _itemType,
                maxOrderQuantityForBike: 7,
                storeId: this.storeId,
                type: _deliveryType // ADHOC or SCHEDULED or SELF
            };
    
            await lastValueFrom(this._storesService.postStoreDeliveryDetails(this.storeId, deliveryDetailBody))
                .catch(err => {
                    reject('Error in postStoreDeliveryDetails')
                    error = true;
                })
            resolve("done")
        });
        return promise;
    }

    async storeCreationStatus(status) {
        let promise = new Promise(async (resolve, reject) => {

            if ( status === false ) {
                // Show a success message (it can also be an error message)
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Store Created',
                    message: 'You have successfully created a new store',
                    icon: {
                        show: true,
                        name: "heroicons_outline:clipboard-check",
                        color: "success"
                    },
                    actions: {
                        confirm: {
                            label: 'OK',
                            color: "primary",
                        },
                        cancel: {
                            show: false,
                        },
                    }
                });

                // Subscribe to the confirmation dialog closed action
                confirmation.afterClosed().subscribe((result) => {

                    // If the confirm button pressed...
                    if ( result === 'confirmed' )
                    {

                        // Navigate to the confirmation required page
                        this._router.navigateByUrl('/products');

                    }
                });

            }
            else if ( status === true ) {
                // Show a failed message (it can also be an error message)
                const confirmation = this._fuseConfirmationService.open({
                    title  : 'Store Creation Failed',
                    message: 'Something is wrong while creating your store. Please try again',
                    icon: {
                        show: true,
                        name: "heroicons_outline:exclamation",
                        color: "error"
                    },
                    actions: {
                        confirm: {
                            label: 'OK',
                            color: "primary",
                        },
                        cancel: {
                            show: false,
                        },
                    }
                });

                // Delete the product on the server
                this._storesService.delete(this.storeId).subscribe(() => {

                    // Enable the form except payment type
                    this.storeAccountForm.enable({emitEvent: false});
                    this.storeAccountForm.get('paymentType').disable();
                    
                    // empty out storeId
                    this.storeId = '';

                    // set selected store to null anyway
                    this._storesService.store = null;
                    
                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                });
            }
        });
        return promise;
    }

    // Quil editor text limit
    textChanged($event) {
        const MAX_LENGTH = 500;
        if ($event.editor.getLength() > MAX_LENGTH) {
           $event.editor.deleteText(MAX_LENGTH, $event.editor.getLength());
        }
    }

    toggleCustomDomain() {
        if (!this.customDomain) {
            this.storeAccountForm.get('subdomain').setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(63), EditStoreValidationService.domainValidator]);
            this.storeAccountForm.get('subdomain').updateValueAndValidity();
        }
        else {
            this.storeAccountForm.get('subdomain').setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(63), EditStoreValidationService.customDomainValidator]);
            this.storeAccountForm.get('subdomain').updateValueAndValidity();
        }
        this.storeAccountForm.get('subdomain').markAsTouched({onlySelf: true});
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
}
