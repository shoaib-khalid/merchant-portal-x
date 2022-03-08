import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { StoresService } from 'app/core/store/store.service';
import { TimeSelector } from 'app/layout/common/time-selector/timeselector.component';

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
                    
                    //----------------
                    //  Start Time
                    //----------------
                    let _itemOpenTimeHour = item.openTime.split(":")[0];
                    if (item.openTime.split(":")[0] > 12) {
                        _itemOpenTimeHour = _itemOpenTimeHour - 12;
                        _itemOpenTimeHour = ((_itemOpenTimeHour < 10) ? '0' : '') + _itemOpenTimeHour;    
                    }                    

                    let _itemOpenTimeMinute = item.openTime.split(":")[1];

                    let _itemOpenTimeAMPM : 'AM' | 'PM';
                    if (item.openTime.split(":")[0] >= 12) {
                        _itemOpenTimeAMPM = "PM";
                    } else {
                        _itemOpenTimeAMPM = "AM";
                    }
                    
                    let _item = item;
                    _item["openTime"] = new TimeSelector(_itemOpenTimeHour,_itemOpenTimeMinute, _itemOpenTimeAMPM);

                    //----------------
                    //    End Time
                    //----------------
                    let _itemCloseTimeHour = item.closeTime.split(":")[0];
                    if (item.closeTime.split(":")[0] > 12) {
                        _itemCloseTimeHour = _itemCloseTimeHour - 12;
                        _itemCloseTimeHour = ((_itemCloseTimeHour < 10) ? '0' : '') + _itemCloseTimeHour;    
                    }

                    let _itemCloseTimeMinute = item.closeTime.split(":")[1];

                    let _itemCloseTimeAMPM : 'AM' | 'PM';
                    if (item.closeTime.split(":")[0] >= 12) {
                        _itemCloseTimeAMPM = "PM";
                    } else {
                        _itemCloseTimeAMPM = "AM";
                    }

                    _item["closeTime"] = new TimeSelector(_itemCloseTimeHour,_itemCloseTimeMinute, _itemCloseTimeAMPM);

                    //----------------
                    //Break Start Time
                    //----------------                    
                    let _itemBreakOpenTimeHour = (item.breakStartTime && item.breakStartTime !== null) ? item.breakStartTime.split(":")[0] : "--";
                    if (item.breakStartTime && item.breakStartTime !== null && item.breakStartTime.split(":")[0] > 12) {
                        _itemBreakOpenTimeHour = _itemBreakOpenTimeHour - 12;
                        _itemBreakOpenTimeHour = ((_itemBreakOpenTimeHour < 10) ? '0' : '') + _itemBreakOpenTimeHour;    
                    }

                    let _itemBreakOpenTimeMinute = (item.breakStartTime && item.breakStartTime !== null) ? item.breakStartTime.split(":")[1] : "--";

                    let _itemBreakOpenTimeAMPM : 'AM' | 'PM' | '--';
                    if (item.breakStartTime && item.breakStartTime !== null && item.breakStartTime.split(":")[0] >= 12) {
                        _itemBreakOpenTimeAMPM = (item.breakStartTime && item.breakStartTime !== null) ? "PM" : "--";
                    } else {
                        _itemBreakOpenTimeAMPM = (item.breakStartTime && item.breakStartTime !== null) ? "AM": "--";
                    }

                    _item["breakStartTime"] = new TimeSelector(_itemBreakOpenTimeHour,_itemBreakOpenTimeMinute, _itemBreakOpenTimeAMPM);

                    //--------------
                    //Break End Time
                    //--------------
                    let _itemBreakCloseTimeHour = (item.breakEndTime && item.breakEndTime !== null) ? item.breakEndTime.split(":")[0] : "--";
                    if (item.breakEndTime && item.breakEndTime !== null && item.breakEndTime.split(":")[0] > 12) {
                        _itemBreakCloseTimeHour = _itemBreakCloseTimeHour - 12;
                        _itemBreakCloseTimeHour = ((_itemBreakCloseTimeHour < 10) ? '0' : '') + _itemBreakCloseTimeHour;  
                    }

                    let _itemBreakeCloseTimeMinute = (item.breakEndTime && item.breakEndTime !== null) ? item.breakEndTime.split(":")[1] : "--";

                    let _itemBreakCloseTimeAMPM : 'AM' | 'PM' | '--';
                    
                    if (item.breakEndTime && item.breakEndTime !== null && item.breakEndTime.split(":")[0] >= 12) {
                        _itemBreakCloseTimeAMPM = (item.breakEndTime && item.breakEndTime !== null) ? "PM" : "--";
                    } else {
                        _itemBreakCloseTimeAMPM = (item.breakEndTime && item.breakEndTime !== null) ? "AM" : "--";
                    }

                    _item["breakEndTime"] = new TimeSelector(_itemBreakCloseTimeHour,_itemBreakeCloseTimeMinute, _itemBreakCloseTimeAMPM);                    

                    this.storeTiming = this.storeTimingForm.get('storeTiming') as FormArray;
                    this.storeTiming.push(this._formBuilder.group(_item));
                });

                // Mark for check
                this._changeDetectorRef.markForCheck();
            } 
         );
    }

    changeTime(i){
        //Working Hour Start Time
        let startTime = this.storeTimingForm.get('storeTiming').value[i].openTime;
        let _startTime;

        // if (startTime.timeAmPm === "PM") {
        //     _startTime = parseInt(startTime.timeHour) + 12;
        // } else {
        //     _startTime = startTime.timeHour;
        // }

        if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
            _startTime = parseInt(startTime.timeHour) + 12;
        } else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
            _startTime = parseInt(startTime.timeHour) - 12;
        } else {
            _startTime = startTime.timeHour;
        }

        const workingHourStartTime = new Date();
        workingHourStartTime.setHours(_startTime,startTime.timeMinute,0);

        //Working Hour End Time
        let endTime = this.storeTimingForm.get('storeTiming').value[i].closeTime;
        let _endTime;
  
        // if (endTime.timeAmPm === "PM") {
        //     _endTime = parseInt(endTime.timeHour) + 12;
        // } else {
        //     _endTime = endTime.timeHour;
        // }
        
        if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
            _endTime = parseInt(endTime.timeHour) + 12;
        } else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
            _endTime = parseInt(endTime.timeHour) - 12;
        } else {
            _endTime = endTime.timeHour;
        }

        // if(_endTime > 23 && endTime.timeMinute > "55") {
        //     this.timeAlert[i] ="End time exceeds minimum time range for today" ;
        // }

        const workingHourEndTime = new Date();
        workingHourEndTime.setHours(_endTime,endTime.timeMinute,0);
        
        // 12:00 AM
        const minToday = new Date();
        minToday.setHours(0,0,0);

        //working Hour Display Error
        if (workingHourEndTime.getTime() === minToday.getTime()) {
            this.timeAlert[i] ="End time exceeds minimum time range for today (11:55PM)" ;
        } else if( workingHourStartTime >= workingHourEndTime){            
            this.timeAlert[i] ="End time range incorrect" ;
        }else{
            this.timeAlert[i] = " " ;
        }  
    }

    changeBreakTime(i){
        //Break Hour Start Time
        let breakStartTime = this.storeTimingForm.get('storeTiming').value[i].breakStartTime;
        let _breakStartTime;

        // if (breakStartTime.timeAmPm === "PM") {
        //     _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
        // } else {
        //     _breakStartTime = breakStartTime.timeHour;
        // }

        if (breakStartTime.timeAmPm === "PM" && breakStartTime.timeHour !== "12") {
            _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
        } else if (breakStartTime.timeAmPm === "AM" && breakStartTime.timeHour === "12") {
            _breakStartTime = parseInt(breakStartTime.timeHour) - 12;
        } else {
            _breakStartTime = breakStartTime.timeHour;
        }

        const breakHourStartTime = new Date();
        breakHourStartTime.setHours(_breakStartTime,breakStartTime.timeMinute,0);

        //Break hour End Time
        let breakEndTime = this.storeTimingForm.get('storeTiming').value[i].breakEndTime;
        let _breakEndTime;
    
        // if (breakEndTime.timeAmPm === "PM") {
        //     _breakEndTime = parseInt(breakEndTime.timeHour) + 12;
        // } else {
        //     _breakEndTime = breakEndTime.timeHour;
        // }
        
        if (breakEndTime.timeAmPm === "PM" && breakEndTime.timeHour !== "12") {
            _breakEndTime = parseInt(breakEndTime.timeHour) + 12;
        } else if (breakEndTime.timeAmPm === "AM" && breakEndTime.timeHour === "12") {
            _breakEndTime = parseInt(breakEndTime.timeHour) - 12;
        } else {
            _breakEndTime = breakEndTime.timeHour;
        }

        const breakHourEndTime = new Date();
        breakHourEndTime.setHours(_breakEndTime,breakEndTime.timeMinute,0);

        //Display Error
        if( breakHourStartTime >= breakHourEndTime ){
            this.timeAlert[i] ="Break Hour End time range incorrect" ;
        }else{
            this.timeAlert[i] = " " ;
        } 
    }

    updateStoreOpening(day: string){

        let index = this._storeTiming.findIndex(dayList => dayList.day === day);
        this._storeTiming[index].isOpen = !this._storeTiming[index].isOpen;
        this._storeTiming[index].isOff = !this._storeTiming[index].isOff;
        this._storeTiming[index].isBreakTime = this._storeTiming[index].isOpen;
        if( this._storeTiming[index].isBreakTime === false){
            this._storeTiming[index].breakStartTime.timeHour = "--";
            this._storeTiming[index].breakStartTime.timeMinute = "--";
            this._storeTiming[index].breakStartTime.timeAmPm = "--";

            this._storeTiming[index].breakEndTime.timeHour = "--";
            this._storeTiming[index].breakEndTime.timeMinute = "--";
            this._storeTiming[index].breakEndTime.timeAmPm = "--";
        } else {
            this._storeTiming[index].breakStartTime.timeHour = "01";
            this._storeTiming[index].breakStartTime.timeMinute = "00";
            this._storeTiming[index].breakStartTime.timeAmPm = "PM";

            this._storeTiming[index].breakEndTime.timeHour = "02";
            this._storeTiming[index].breakEndTime.timeMinute = "00";
            this._storeTiming[index].breakEndTime.timeAmPm = "PM";
        }

        this.storeTiming.clear();
        this._storeTiming.forEach(item => {
            this.storeTiming = this.storeTimingForm.get('storeTiming') as FormArray;
            this.storeTiming.push(this._formBuilder.group(item));
        }); 
    }

    toggleBreakHour (e, i){

        let storeTiming = this.storeTimingForm.get('storeTiming').value;

        if(e.checked === false){

            storeTiming[i].breakStartTime.timeHour = "--";
            storeTiming[i].breakStartTime.timeMinute = "--";
            storeTiming[i].breakStartTime.timeAmPm = "--"

            storeTiming[i].breakEndTime.timeHour = "--";
            storeTiming[i].breakEndTime.timeMinute = "--";
            storeTiming[i].breakEndTime.timeAmPm = "--"

            this.storeTimingForm.get('storeTiming').patchValue(storeTiming);
            this.storeTimingForm.get('storeTiming').value[i].isBreakTime = false;
        } else{
            storeTiming[i].breakStartTime.timeHour = "01";
            storeTiming[i].breakStartTime.timeMinute = "00";
            storeTiming[i].breakStartTime.timeAmPm = "PM"

            storeTiming[i].breakEndTime.timeHour = "02";
            storeTiming[i].breakEndTime.timeMinute = "00";
            storeTiming[i].breakEndTime.timeAmPm = "PM"

            this.storeTimingForm.get('storeTiming').patchValue(storeTiming);
            this.storeTimingForm.get('storeTiming').value[i].isBreakTime = true;
        }
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    applyToAll(index){

        let storeTiming = this.storeTimingForm.get('storeTiming').value
        
        let _storeTiming = {
            breakStartTimeHour: storeTiming[index].breakStartTime.timeHour,
            breakStartTimeMinute: storeTiming[index].breakStartTime.timeMinute,
            breakStartTimeAmPm: storeTiming[index].breakStartTime.timeAmPm,

            breakEndTimeHour: storeTiming[index].breakEndTime.timeHour,
            breakEndTimeMinute: storeTiming[index].breakEndTime.timeMinute,
            breakEndTimeAmPm: storeTiming[index].breakEndTime.timeAmPm,

            openTime: storeTiming[index].openTime,
            closeTime: storeTiming[index].closeTime,

            breakToggle: storeTiming[index].isBreakTime
        } 

        this.storeTimingForm.get('storeTiming').value.forEach((item, i) => {
            storeTiming[i].breakStartTime.timeHour = _storeTiming.breakStartTimeHour;
            storeTiming[i].breakStartTime.timeMinute = _storeTiming.breakStartTimeMinute;
            storeTiming[i].breakStartTime.timeAmPm = _storeTiming.breakStartTimeAmPm;

            storeTiming[i].breakEndTime.timeHour =_storeTiming.breakEndTimeHour;
            storeTiming[i].breakEndTime.timeMinute =_storeTiming.breakEndTimeMinute;
            storeTiming[i].breakEndTime.timeAmPm =_storeTiming.breakEndTimeAmPm;

            storeTiming[i].openTime =_storeTiming.openTime;
            storeTiming[i].closeTime =_storeTiming.closeTime;

            storeTiming[i].isBreakTime = _storeTiming.breakToggle;
        })
        this.storeTimingForm.get('storeTiming').patchValue(storeTiming);
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

            // Start Time if PM read 24hrs format
            let startTime = filteredItem.openTime;
            let _startTime;
    
            // if (startTime.timeAmPm === "PM") {
            //     _startTime = parseInt(startTime.timeHour) + 12;
            // } else {
            //     _startTime = startTime.timeHour;
            // }

            if (startTime.timeAmPm === "PM" && startTime.timeHour !== "12") {
                _startTime = parseInt(startTime.timeHour) + 12;
            } else if (startTime.timeAmPm === "AM" && startTime.timeHour === "12") {
                _startTime = parseInt(startTime.timeHour) - 12;
            } else {
                _startTime = startTime.timeHour;
            }

            // End Time if PM read 24hrs format
            let endTime = filteredItem.closeTime;
            let _endTime;

            // if (endTime.timeAmPm === "PM") {
            //     _endTime = parseInt(endTime.timeHour) + 12;
            // } else {
            //     _endTime = endTime.timeHour;
            // }

            if (endTime.timeAmPm === "PM" && endTime.timeHour !== "12") {
                _endTime = parseInt(endTime.timeHour) + 12;
            } else if (endTime.timeAmPm === "AM" && endTime.timeHour === "12") {
                _endTime = parseInt(endTime.timeHour) - 12;
            } else {
                _endTime = endTime.timeHour;
            }

            // Break Start Time if PM read 24hrs format
            let breakStartTime = filteredItem.breakStartTime;
            let _breakStartTime;
    
            // if (breakStartTime.timeAmPm !== null && breakStartTime.timeAmPm === "PM") {
            //     _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
            // } else {
            //     _breakStartTime = breakStartTime.timeHour;
            // }
            
            if (breakStartTime.timeAmPm === "PM" && breakStartTime.timeHour !== "12") {
                _breakStartTime = parseInt(breakStartTime.timeHour) + 12;
            } else if (breakStartTime.timeAmPm === "AM" && breakStartTime.timeHour === "12") {
                _breakStartTime = parseInt(breakStartTime.timeHour) - 12;
            } else {
                _breakStartTime = breakStartTime.timeHour;
            }

            // Break End Time if PM read 24hrs format
            let breakEndTime = filteredItem.breakEndTime;
            let _breakendTime;
    
            // if (breakEndTime.timeAmPm !== null && breakEndTime.timeAmPm === "PM") {
            //     _breakendTime = parseInt(breakEndTime.timeHour) + 12;
            // } else {
            //     _breakendTime = breakEndTime.timeHour;
            // }

            if (breakEndTime.timeAmPm === "PM" && breakEndTime.timeHour !== "12") {
                _breakendTime = parseInt(breakEndTime.timeHour) + 12;
            } else if (breakEndTime.timeAmPm === "AM" && breakEndTime.timeHour === "12") {
                _breakendTime = parseInt(breakEndTime.timeHour) - 12;
            } else {
                _breakendTime = breakEndTime.timeHour;
            }
            
            const _filteredItem = { 
                breakEndTime: _breakendTime + ":" + filteredItem.breakEndTime.timeMinute,
                breakStartTime: _breakStartTime + ":" + filteredItem.breakStartTime.timeMinute,
                closeTime: _endTime + ":" + filteredItem.closeTime.timeMinute,
                day: filteredItem.day,
                isOff: filteredItem.isOff,
                openTime: _startTime + ":" + filteredItem.openTime.timeMinute,
                storeId: filteredItem.storeId
            }
            _filteredItem.isOff = !isOpen;
            
            if (isBreakTime === false) {
                _filteredItem.breakStartTime = null;
                _filteredItem.breakEndTime = null;
                filteredItem.breakStartTime.timeAmPm = null;
                filteredItem.breakEndTime.timeAmPm = null;
                
                this.storeTimingForm.get('storeTiming').value[i].breakStartTime = null;
                this.storeTimingForm.get('storeTiming').value[i].breakEndTime = null;
                
            } else {
                this.storeTimingForm.get('storeTiming').value[i].breakStartTime = _filteredItem.breakStartTime;
                this.storeTimingForm.get('storeTiming').value[i].breakEndTime = _filteredItem.breakEndTime;
            }

            this._storesService.putTiming(storeId, item.day, _filteredItem)
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
