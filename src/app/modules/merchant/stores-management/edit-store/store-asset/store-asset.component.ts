import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { StoresService } from 'app/core/store/store.service';
import { NgxGalleryOptions, NgxGalleryAnimation } from 'ngx-gallery-9';

@Component({
    selector       : 'store-asset',
    templateUrl    : './store-asset.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreAssetComponent implements OnInit
{
    storeId: string;

    storeBannerMobile: any = [];

    imageCollection:any = [];
    galleryOptionsBannerDesktop: NgxGalleryOptions[] = [];
    galleryOptionsBannerMobile: NgxGalleryOptions[] = [];

    storeAssetForm: FormGroup;
    plans: any[];
    // Image part    
    files: {
        description: string,
        type: string,
        fileSource: any,
        selectedFileName: string, 
        selectedFiles: any, 
        recommendedImageWidth: string, 
        recommendedImageHeight: string, 
        selectedImageWidth: string, 
        selectedImageHeight: string,
        toDelete: string[],
        toAdd:any[],
        isMultiple: boolean,
        galleryImages: any[],
        assetId: string,
        toDeleted: boolean
    }[];

    /**
     * Constructor
     */
    constructor(
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
                description: "Logo",
                type: "LogoUrl",
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: false,
                galleryImages: [],
                assetId: null,
                toDeleted: false
            },
            { 
                description: "BannerDesktop",
                type: "BannerDesktopUrl", 
                fileSource: null,
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "1110", 
                recommendedImageHeight: "250", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: true,
                galleryImages: [],
                assetId: null,
                toDeleted: false
            },
            { 
                description: "BannerMobile",
                type: "BannerMobileUrl",
                fileSource: null, 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: true,
                galleryImages: [],
                assetId: null,
                toDeleted: false
            },
            { 
                description: "Favicon",
                type: "FaviconUrl",
                fileSource: null, 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "950", 
                recommendedImageHeight: "260", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: false,
                galleryImages: [],
                assetId: null,
                toDeleted: false
            },
            { 
                description: "CoverImage",
                type: "CoverImageUrl",
                fileSource: null, 
                selectedFileName: "", 
                selectedFiles: null, 
                recommendedImageWidth: "500", 
                recommendedImageHeight: "500", 
                selectedImageWidth: "", 
                selectedImageHeight: "",
                toDelete: [],
                toAdd:[],
                isMultiple: false,
                galleryImages: [],
                assetId: null,
                toDeleted: false
            }
        ];

        // initialise gallery
        // set galleryOptions
        this.galleryOptionsBannerDesktop = [
            {
                preview: false,
                imageArrows: true,
                width: '780px',
                height: '210px',
                thumbnailsColumns: 3,
                imageAnimation: NgxGalleryAnimation.Slide,
                thumbnailsArrows: true,
                imageArrowsAutoHide: false, 
                thumbnailsArrowsAutoHide: true,
                thumbnailsAutoHide: false,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: (event, index) => {
                            
                            this.deleteBannerDesktop(event, index)
                        },
                    }
                ],
                // "imageSize": "contain",
                "previewCloseOnClick": true, 
                "previewCloseOnEsc": true,
                // "thumbnailsRemainingCount": true
            },
            // max-width 767 Mobile configuration
            {
                breakpoint: 767,
                thumbnailsColumns: 3,
                thumbnailsAutoHide: false,
                width: '280px',
                height: '210px',
                imagePercent: 100,
                thumbnailsPercent: 30,
                thumbnailsMargin: 10,
                thumbnailMargin: 5,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: () => {},
                    }
                ]
            }
        ];

        this.galleryOptionsBannerMobile = [
            {
                preview: false,
                imageArrows: true,
                width: '310px',
                height: '210px',
                thumbnailsColumns: 3,
                imageAnimation: NgxGalleryAnimation.Slide,
                thumbnailsArrows: true,
                imageArrowsAutoHide: false, 
                thumbnailsArrowsAutoHide: true,
                thumbnailsAutoHide: false,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: (event, index) => {
                            
                            this.deleteBannerMobile(event, index)
                        },
                    }
                ],
                // "imageSize": "contain",
                "previewCloseOnClick": true, 
                "previewCloseOnEsc": true,
                // "thumbnailsRemainingCount": true
            },
            // max-width 767 Mobile configuration
            {
                breakpoint: 767,
                thumbnailsColumns: 3,
                thumbnailsAutoHide: false,
                width: '280px',
                height: '210px',
                imagePercent: 100,
                thumbnailsPercent: 30,
                thumbnailsMargin: 10,
                thumbnailMargin: 5,
                thumbnailActions: [
                    {
                        icon: 'fa fa-times-circle',
                        onClick: () => {},
                    }
                ]
            }
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
                
                // ----------------
                // set assets image
                // ----------------
                
                response.storeAssets.forEach(item => {
                    
                    if(item.assetType === "LogoUrl") {
                        this.files[0].fileSource = item.assetUrl;
                        this.files[0].assetId = item.id;
                        
                    } else if (item.assetType === "BannerDesktopUrl") {
                        // this.files[1].fileSource = item.assetUrl

                        this.files[1].galleryImages.push({
                            small       : '' + item.assetUrl,
                            medium      : '' + item.assetUrl,
                            big         : '' + item.assetUrl,
                            assetId     : item.id
                        }); 
                        
                    } else if (item.assetType === "BannerMobileUrl") {
                        // this.files[2].fileSource = item.assetUrl
                        
                        this.files[2].galleryImages.push({
                            small   : '' + item.assetUrl,
                            medium  : '' + item.assetUrl,
                            big     : '' + item.assetUrl,
                            assetId : item.id
                        });

                    } else if (item.assetType === "FaviconUrl") {
                        this.files[3].fileSource = item.assetUrl;
                        this.files[3].assetId = item.id;
                    } 
                    else if (item.assetType === "CoverImageUrl") {
                        this.files[4].fileSource = item.assetUrl;
                        this.files[4].assetId = item.id;
                    } 
                    

                    // Mark for check
                    this._changeDetectorRef.markForCheck();

                });

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
        if (event.target.files.length > 0) {
            this.files[index].fileSource = null;
            this.files[index].selectedFileName = "";
            this.files[index].selectedFiles = event.target.files;
        }
        
        let maxSize = 1048576;
        var maxSizeInMB = (maxSize / (1024*1024)).toFixed(2);
        if (this.files[index].selectedFiles[0].size > maxSize ){
            // Show a success message (it can also be an error message)
            const confirmation = this._fuseConfirmationService.open({
                title  : 'Image size limit',
                message: 'Your uploaded image exceeds the maximum size of ' + maxSizeInMB + ' MB!',
                icon: {
                    show: true,
                    name: "image_not_supported",
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
            return;
        }

        if (this.files[index].selectedFiles && this.files[index].selectedFiles[0] && this.files[index].selectedFiles[0].size < maxSize ) {
            const numberOfFiles = this.files[index].selectedFiles.length;
            for (let i = 0; i < numberOfFiles; i++) {
            const reader = new FileReader();
            
            reader.onload = (e: any) => {
                if (this.files[index].isMultiple) {
                    if (index === 1) {
                        this.files[1].fileSource = e.target.result;
                        this.files[1].toAdd.push(event.target.files);
                        
                        if(this.files[1].galleryImages.length < 3){
                            
                            this.files[1].galleryImages.unshift({
                                small           : '' + e.target.result,
                                medium          : '' + e.target.result,
                                big             : '' + e.target.result
                            });

                            var image = new Image();
                            image.src = e.target.result;
            
                            image.onload = (imageInfo: any) => {
                                this.files[1].selectedImageWidth = imageInfo.path[0].width;
                                this.files[1].selectedImageHeight = imageInfo.path[0].height;
            
                                this._changeDetectorRef.markForCheck();
                            };
                        }
                        this._changeDetectorRef.markForCheck();

                    } else if (index === 2) {
                        this.files[2].fileSource = e.target.result;
                        this.files[2].toAdd.push(event.target.files);

                        if(this.files[2].galleryImages.length < 3){

                            this.files[2].galleryImages.unshift({
                                small   : '' + e.target.result,
                                medium  : '' + e.target.result,
                                big     : '' + e.target.result,

                            });

                            var image = new Image;
                            image.src = e.target.result;
            
                            image.onload = (imageInfo: any) => {
                                this.files[2].selectedImageWidth = imageInfo.path[0].width;
                                this.files[2].selectedImageHeight = imageInfo.path[0].height;
            
                                this._changeDetectorRef.markForCheck();
                            };
                        }
                        this._changeDetectorRef.markForCheck();
                    }
                } else {
                    
                    this.files[index].fileSource = e.target.result;

                    var image = new Image();
                    image.src = e.target.result;
    
                    image.onload = (imageInfo: any) => {
                        this.files[index].selectedImageWidth = imageInfo.path[0].width;
                        this.files[index].selectedImageHeight = imageInfo.path[0].height;
    
                        this._changeDetectorRef.markForCheck();
                    };
                }
                
                this._changeDetectorRef.markForCheck();                
            };
            
            reader.readAsDataURL(this.files[index].selectedFiles[i]);
            this.files[index].selectedFileName = this.files[index].selectedFiles[i].name;
            }
        }
        if (this.files[0].selectedFiles) {
            this.files[0].toDeleted = false
        } else if (this.files[3].selectedFiles) {
            this.files[3].toDeleted = false
        }
        this._changeDetectorRef.markForCheck();
    }

    createImageFromBlob(image: Blob) {
        let reader = new FileReader(); //you need file reader for read blob data to base64 image data.
        return  reader.readAsDataURL(image);
    }

    deleteBannerDesktop(e, index){
        let assetId = this.files[1].galleryImages[index].assetId;

        this.files[1].toDelete.push(assetId);
        this.files[1].galleryImages.splice(index,1);

        if(this.files[1].galleryImages.length < 1){
            this.files[1].fileSource = null
        }
    }

    deleteBannerMobile(e, index){
        let assetId = this.files[2].galleryImages[index].assetId;

        this.files[2].toDelete.push(assetId);
        this.files[2].galleryImages.splice(index,1)

        if(this.files[2].galleryImages.length < 1){
            this.files[2].fileSource = null
        }
    }

    deleteLogo() {
        this.files[0].toDeleted = true;        
        this.files[0].fileSource = null;
        this._changeDetectorRef.markForCheck();
    }

    deleteFavicon(){
        this.files[3].toDeleted = true;        
        this.files[3].fileSource = null;
        this._changeDetectorRef.markForCheck();
    }
    
    deleteCoverImage(){
        this.files[4].toDeleted = true;        
        this.files[4].fileSource = null;
        this._changeDetectorRef.markForCheck();
    }

    updateStoreAsset(): void
    {
        // ---------------------------
        // Update Store Assets
        // ---------------------------
        
        this.files.forEach((item) =>{
            
            //Logo update using item.selected files
            if (item.type === 'LogoUrl'){
                
                let formData = new FormData();

                if (item.selectedFiles && item.selectedFiles !== null){
                    formData.append('assetFile',item.selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);
                }

                if (item.selectedFiles && this.files[0].assetId !== null && this.files[0].toDeleted === false) {                   
                    this._storesService.putAssets(this.storeId, this.files[0].assetId, formData, "LogoUrl")
                        .subscribe(response => {
                            console.info('File updated the file successfully');

                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        }, (err: any) => {
                                console.error('Could not upload the file');
                        });
                } else if (this.files[0].toDeleted === true && this.files[0].assetId !== null) {
                    this._storesService.deleteAssets(this.storeId, this.files[0].assetId)
                        .subscribe(response => {
                            console.info('File deleted the file successfully');

                            this.files[0].toDeleted = false;

                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                } else {
                    if (item.selectedFiles && item.selectedFiles !== null) {
                        this._storesService.postAssets(this.storeId, "LogoUrl", formData,"Logo")
                            .subscribe(response => {
                                console.info('File uploaded the file successfully');
    
                                this.files[3].assetId = event["id"];
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                }
            }

            // Favicon update using item.selectedFiles
            if (item.type === 'FaviconUrl'){

                let formData = new FormData();

                if (item.selectedFiles && item.selectedFiles !== null){
                    formData.append('assetFile',item.selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);
                }

                if (item.selectedFiles && this.files[3].assetId !== null && this.files[3].toDeleted === false) {
                    this._storesService.putAssets(this.storeId, this.files[3].assetId, formData)
                        .subscribe(response => {
                                console.info('File updated the file successfully');

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                } else if (this.files[3].toDeleted === true && this.files[3].assetId !== null) {
                    this._storesService.deleteAssets(this.storeId, this.files[3].assetId)
                        .subscribe(response => {
                            console.info('File deleted the file successfully');

                            this.files[3].toDeleted = false;
                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        },
                        (err: any) => {
                            console.error('Could not upload the file');
                        });
                } else {
                    if (item.selectedFiles && item.selectedFiles !== null) {
                        this._storesService.postAssets(this.storeId, "FaviconUrl", formData,"Favicon")
                            .subscribe(response => {
                                console.info('File uploaded the file successfully');
    
    
                                this.files[3].assetId = event["id"];
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                }

            }
            // BannerDesktop update using loop for each for delete and post 
            if(item.type === 'BannerDesktopUrl') {
                // toDelete
                item.toDelete.forEach(assetId => {
                    if(assetId){
                        this._storesService.deleteAssets(this.storeId, assetId)
                        .subscribe(response => {
                                console.info('File deleted the file successfully');
        
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                        });
                    }
                });
                // toAdd
                item.toAdd.forEach(selectedFiles => {
                    let formData = new FormData();
                    formData.append('assetFile',selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);

                    if (item.selectedFiles && item.selectedFiles !== null) {
                        this._storesService.postAssets(this.storeId, "BannerDesktopUrl", formData,"BannerDesktop")
                            .subscribe(response => {
                                console.info('Uploaded the file successfully');
        
                                this.files[1].assetId = event["id"];
        
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                });

                
            }
            // BannerMobile update using loop for each for delete and post 
            if(item.type === 'BannerMobileUrl') {
                // toDelete
                item.toDelete.forEach(assetId => {
                    if(assetId){
                        this._storesService.deleteAssets(this.storeId, assetId)
                            .subscribe(response => {
                                console.info('File deleted the file successfully');
        
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                        });
                    }
                });
                
                // toAdd
                item.toAdd.forEach(selectedFiles => {

                    let formData = new FormData();
                    formData.append('assetFile',selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);

                    if (selectedFiles && selectedFiles !== null) {
                        this._storesService.postAssets(this.storeId, "BannerMobileUrl", formData,"BannerMobile")
                            .subscribe(response => {
                                console.info('Uploaded the file successfully');
        
                                this.files[1].assetId = event["id"];
        
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                });
            }
            // Favicon update using item.selectedFiles
            if (item.type === 'CoverImageUrl'){

                let formData = new FormData();

                if (item.selectedFiles && item.selectedFiles !== null){
                    formData.append('assetFile',item.selectedFiles[0]);
                    formData.append('assetType',item.type);
                    formData.append('assetDescription',item.description);
                }

                if (item.selectedFiles && this.files[4].assetId !== null && this.files[4].toDeleted === false) {
                    this._storesService.putAssets(this.storeId, this.files[4].assetId, formData)
                        .subscribe(response => {
                                console.info('File updated the file successfully');

                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                } else if (this.files[4].toDeleted === true && this.files[4].assetId !== null) {
                    this._storesService.deleteAssets(this.storeId, this.files[4].assetId)
                        .subscribe(response => {
                            console.info('File deleted the file successfully');

                            this.files[4].toDeleted = false;
                            // Mark for check
                            this._changeDetectorRef.markForCheck();
                        },
                        (err: any) => {
                            console.error('Could not upload the file');
                        });
                } else {
                    if (item.selectedFiles && item.selectedFiles !== null) {
                        this._storesService.postAssets(this.storeId, "CoverImageUrl", formData,"CoverImage")
                            .subscribe(response => {
                                console.info('File uploaded the file successfully');
    
    
                                this.files[4].assetId = event["id"];
    
                                // Mark for check
                                this._changeDetectorRef.markForCheck();
                            },
                            (err: any) => {
                                console.error('Could not upload the file');
                            });
                    }
                }

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