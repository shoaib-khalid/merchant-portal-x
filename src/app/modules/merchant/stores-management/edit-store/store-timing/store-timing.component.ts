import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'store-timining',
    templateUrl    : './store-timing.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreTimingComponent implements OnInit
{
    storeId: string;
    timeAlert: any = [];

    storeTimingForm: FormGroup;

    _storeTiming: any;
    storeTiming: FormArray;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _storesService: StoresService,
        private _route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,

    )
    {
    }

    /**
    * Getter for access token
    */

        get accessToken(): string
        {
            return localStorage.getItem('accessToken') ?? '';
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
        this.storeTimingForm = this._formBuilder.group({
            // Store Timing
            storeTiming: this._formBuilder.array([]),
            isSnooze: [false],
        });

        this.storeId = this._route.snapshot.paramMap.get('storeid');

        // ----------------------
        // Get Store Details by Id
        // ----------------------

        this._storesService.getStoreById(this.storeId).subscribe(
            (response) => {                
 
                // set store to current store
                this._storesService.store = response;
                this._storesService.storeId = this.storeId;

                // ---------------
                // set timing
                // ---------------

                this._storeTiming = response.storeTiming;
                
                this._storeTiming.map(item => item["isOpen"] = !item.isOff);
                this._storeTiming.map(item => {
                    if (item.breakStartTime === null && item.breakEndTime === null){
                        item["isBreakTime"] = false;
                    }
                    else{
                        item["isBreakTime"] = true;
                    }

                });

                this._storeTiming.forEach(item => {
                    this.storeTiming = this.storeTimingForm.get('storeTiming') as FormArray;
                    this.storeTiming.push(this._formBuilder.group(item));
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            } 
         );
    }

    changeTime(i){
        if(this.storeTimingForm.get('storeTiming').value[i].openTime >= this.storeTimingForm.get('storeTiming').value[i].closeTime ){
            this.timeAlert[i] ="End time range incorrect" ;
        }else{
            this.timeAlert[i] = "" ;
        }   
    }

    changeBreakTime(i, type , e){
        if(this.storeTimingForm.get('storeTiming').value[i].breakStartTime >= this.storeTimingForm.get('storeTiming').value[i].breakEndTime ){
            this.timeAlert[i] ="Break Hour End time range incorrect" ;
        }else{
            this.timeAlert[i] = "" ;
        }   
    }

    updateStoreOpening(day: string){
        let index = this._storeTiming.findIndex(dayList => dayList.day === day);
        this._storeTiming[index].isOpen = !this._storeTiming[index].isOpen;
        this._storeTiming[index].isOff = !this._storeTiming[index].isOff;
    }

    toggleBreakHour (e, i){
        if(e.checked === false){
            this.storeTimingForm.get('storeTiming').value[i].breakStartTime = null;
            this.storeTimingForm.get('storeTiming').value[i].breakEndTime = null;

            this.storeTimingForm.get('storeTiming').value[i].isBreakTime = false;
        } else{
            this.storeTimingForm.get('storeTiming').value[i].breakStartTime = "13:00";
            this.storeTimingForm.get('storeTiming').value[i].breakEndTime = "14:00";

            this.storeTimingForm.get('storeTiming').value[i].isBreakTime = true;
        }
    }

    applyToAll(index){

        let _storeTiming = {
            breakStartTime: this.storeTimingForm.get('storeTiming').value[index].breakStartTime,
            breakEndTime: this.storeTimingForm.get('storeTiming').value[index].breakEndTime,
            openTime: this.storeTimingForm.get('storeTiming').value[index].openTime,
            closeTime: this.storeTimingForm.get('storeTiming').value[index].closeTime
        }

        this.storeTimingForm.get('storeTiming').value.forEach((item, i) => {
            this.storeTimingForm.get('storeTiming').value[i].breakStartTime = _storeTiming.breakStartTime;
            this.storeTimingForm.get('storeTiming').value[i].breakEndTime =_storeTiming.breakEndTime;
            this.storeTimingForm.get('storeTiming').value[i].openTime =_storeTiming.openTime;
            this.storeTimingForm.get('storeTiming').value[i].closeTime =_storeTiming.closeTime;
        })
    }

    /**
     * Send the form
     */
    updateStoreTiming(): void
    {
        // this will remove the item from the object
        const storeTiming = this.storeTimingForm.value.storeTiming;

        let storeId = this.storeId;
        // ---------------------------
        // Update Store Timing
        // ---------------------------
        
        storeTiming.forEach((item,i) => {
            let { isOpen, isBreakTime, ...filteredItem } = item;
            filteredItem.isOff = !isOpen;
            
            if (isBreakTime === false) {
                filteredItem.breakStartTime = null;
                filteredItem.breakEndTime = null;
                
                this.storeTimingForm.get('storeTiming').value[i].breakStartTime = null;
                this.storeTimingForm.get('storeTiming').value[i].breakEndTime = null;

            } else {
                this.storeTimingForm.get('storeTiming').value[i].breakStartTime = filteredItem.breakStartTime;
                this.storeTimingForm.get('storeTiming').value[i].breakEndTime = filteredItem.breakEndTime;
            }
            this._storesService.putTiming(storeId, item.day, filteredItem)
            .subscribe((response)=>{
            });
            
        });

        // Show a success message (it can also be an error message)
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Success',
            message: 'Your store account has been updated successfully!',
            icon: {
                show: true,
                name: "heroicons_outline:check",
                color: "success"
            },
            actions: {
                confirm: {
                    label: 'Ok',
                    color: "primary",
                },
                cancel: {
                    show: false,
                },
            }
        });

        // Enable the form
        this.storeTimingForm.enable();
    }
}
