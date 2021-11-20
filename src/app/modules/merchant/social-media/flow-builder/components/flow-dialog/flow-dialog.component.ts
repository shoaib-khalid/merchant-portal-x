import { Component, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
export interface DialogData {
    title: string;
    description: string;
}

@Component({
    selector: 'flow-dialog',
    templateUrl: 'flow-dialog.component.html',
    styleUrls:["./flow-dialog.component.css"]
})

export class FlowDialogComponent {
    title:any;
    description:any;
    dialogTitle:any;
    constructor(
        public dialogRef: MatDialogRef<FlowDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: {
            title:any;
            description:any;
            dialogTitle:any;
        }
    ) {
        this.title=data.title;
        this.description=data.description;
        this.dialogTitle=data.dialogTitle;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
    createFlow(){
        // this.configService.getFlowId(this.title,this.description);
    }
}