import { HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { StoresService } from 'app/core/store/store.service';

@Component({
    selector       : 'store-asset',
    templateUrl    : './store-asset.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreAssetComponent implements OnInit
{
    storeId: string;

    storeAssetForm: FormGroup;
    plans: any[];
    // Image part    
    files: any;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: FormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _route: ActivatedRoute,
        private _storesService: StoresService,
        private _fuseConfirmationService: FuseConfirmationService,

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
        // Logo & Banner
        this.files = [
            { 
                type: "logo", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
            { 
                type: "banner", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "1110", 
                recommendedImageHeight: "250", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
            { 
                type: "bannerMobile", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: false
            },
        ];

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
                // set assets image
                // ---------------

                this.files[0].fileSource = response.storeAsset.logoUrl;
                this.files[1].fileSource = response.storeAsset.bannerUrl;
                this.files[2].fileSource = response.storeAsset.bannerMobileUrl;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            } 
         );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    /**
    * 
    * @param event 
    */
    selectFiles(fileType,event: any): void {

    // find index of object this.files
    let index = this.files.findIndex(preview => preview.type === fileType);

    // set each of the attributes
    this.files[index].fileSource = null;
    this.files[index].selectedFileName = "";
    this.files[index].selectedFiles = event.target.files;
        
        let maxSize = 2600000;
        if (this.files[index].selectedFiles[0].size > maxSize ){
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image is exceeds the maximum size of ' + maxSize + ' bytes !',
                icon: {
                    show: true,
                    name: "heroicons_outline:exclamation",
                    color: "warn"
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
            return;
        }

        if (this.files[index].selectedFiles && this.files[index].selectedFiles[0] && this.files[index].selectedFiles[0].size < maxSize ) {
            const numberOfFiles = this.files[index].selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
            
            reader.onload = (e: any) => {
                
                // set this.files[index].delete to false 
                this.files[index].toDelete = true;

                this.files[index].fileSource = e.target.result;

                var image = new Image();
                image.src = e.target.result;

                image.onload = (imageInfo: any) => {
                    this.files[index].selectedImageWidth = imageInfo.path[0].width;
                    this.files[index].selectedImageHeight = imageInfo.path[0].height;

                    this._changeDetectorRef.markForCheck();
                };

                this._changeDetectorRef.markForCheck();                
            };
            // console.log("this.files["+index+"].selectedFiles["+i+"]",this.files[index].selectedFiles[i])
            reader.readAsDataURL(this.files[index].selectedFiles[i]);
            this.files[index].selectedFileName = this.files[index].selectedFiles[i].name;
            }
        }
        this._changeDetectorRef.markForCheck();
    } 

    deletefiles(index: number) { 
        
        this.files[index].toDelete = true;
        this.files[index].fileSource = '';

        this._changeDetectorRef.markForCheck();
    }

    updateStoreAsset(): void
    {
        // ---------------------------
        // Update Store Assets
        // ---------------------------

        this.files.forEach(item =>{
            
            let formData = new FormData();

            if (item.selectedFiles !== null){
                formData.append(item.type,item.selectedFiles[0])
            }

            let storeAssetFiles = item.fileSource;

            if (item.toDelete === true && item.type === 'logo'){
                this._storesService.deleteAssetsLogo(this.storeId).subscribe(() => {
                    console.log("storeAssetFiles: ", "'"+storeAssetFiles+"'")
                    if (storeAssetFiles && storeAssetFiles !== "") {
                        this._storesService.postAssets(this.storeId, formData, "logo", storeAssetFiles).subscribe(
                            (event: any) => {
                            if (event instanceof HttpResponse) {
                                console.log('Uploaded the file successfully');

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                });
            }
            if (item.toDelete === true && item.type === 'banner'){
                this._storesService.deleteAssetsBanner(this.storeId).subscribe(() => {
                    console.log("storeAssetFiles 1: ", "'"+storeAssetFiles+"'")
                    if (storeAssetFiles && storeAssetFiles !== ""){
                        this._storesService.postAssets(this.storeId, formData, "banner", storeAssetFiles).subscribe(
                            (event: any) => {
                            if (event instanceof HttpResponse) {
                                console.log('Uploaded the file successfully');

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                });
            }
            if (item.toDelete === true && item.type === 'bannerMobile'){
                this._storesService.deleteAssetsBannerMobile(this.storeId).subscribe(() => {
                    console.log("storeAssetFiles 2: ", "'"+storeAssetFiles+"'")
                    if (storeAssetFiles && storeAssetFiles !== ""){
                        this._storesService.postAssets(this.storeId, formData, "bannerMobile", storeAssetFiles).subscribe(
                            (event: any) => {
                            if (event instanceof HttpResponse) {
                                console.log('Uploaded the file successfully');

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            }
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                });
            }
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
    }
}