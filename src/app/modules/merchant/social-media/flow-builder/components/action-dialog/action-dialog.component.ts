import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
export interface DialogData {
    title: string;
    description: string;
}

@Component({
    selector: 'action-dialog',
    templateUrl: 'action-dialog.component.html',
    styleUrls: ["./action-dialog.component.css"]
})

export class ActionDialog {
    title: any;
    url: any;
    reqType: any = ""
    vheader: boolean = true;
    vbody: boolean = false;
    bodyEnabled = false;
    vresponse: boolean = false;
    vrespMapping: boolean = false;
    reqheaders: any = [{ key: "", value: "" }];
    bodyText: any = ""
    reqMapping: any = [{ path: "", dataVariable: "", optional: "" }]
    bodyFormat: any = "json";
    responseMappingFormat: any = "json";

    constructor(
        public dialogRef: MatDialogRef<ActionDialog>,
        @Inject(MAT_DIALOG_DATA) public data: {
            reqType: any,
            url: any,
            reqheaders: any,
            bodyFormat: any,
            bodyText: any,
            reqMapping: any,
            responseMappingFormat: any

        }
    ) {
        this.reqType = data.reqType;
        this.url = data.url;
        this.reqheaders = data.reqheaders;
        this.bodyFormat = data.bodyFormat;
        this.bodyText = data.bodyText;
        this.reqMapping = data.reqMapping;
        this.responseMappingFormat = data.responseMappingFormat;
        if (this.reqType === "POST") {
            this.bodyEnabled = true;
        }
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
    openExternalRequestForm() {

    }

    headers() {
        this.setTopTextColorToBlack();
        this.setAlltoFalse();
        this.vheader = true;
        document.getElementById("headText").style.color = "blue";

    }

    body() {
        this.setTopTextColorToBlack();
        this.setAlltoFalse();
        if (this.bodyEnabled) {
            this.vbody = true;
        }
        document.getElementById("bodyText").style.color = "blue";
    }

    response() {
        this.setAlltoFalse();
        this.vresponse = true;
    }

    respMapping() {
        this.setTopTextColorToBlack();
        this.setAlltoFalse();
        this.vrespMapping = true;
        document.getElementById("responseMappingText").style.color = "blue";

    }
    setAlltoFalse() {
        this.vheader = false;
        this.vbody = false;
        this.vresponse = false;
        this.vrespMapping = false;
    }
    addReqHeader() {
        this.reqheaders.push({ key: "", value: "" })
    }
    keyChange(event, i) {
        this.reqheaders[i].key = event.target.value;
    }
    valueChange(event, i) {
        this.reqheaders[i].value = event.target.value;

    }
    addRequestMapping() {
        this.reqMapping.push({ path: "", dataVariable: "", optional: "" })
    }
    jsonPathChange(event, i) {
        this.reqMapping[i].path = event.target.value;

    }
    customFieldChange(event, i) {
        this.reqMapping[i].dataVariable = event.target.value;

    }

    setTopTextColorToBlack() {
        var text: any = document.getElementsByClassName("elements");
        for (var i = 0; i < text.length; i++) {
            text[i].style.color = "black";
        }
    }

    updatedOptional(event, i) {

        this.reqMapping[i].optional = event.target.value;

    }

    requestMethodChange() {
        if ((this.reqType === "POST") || (this.reqType === "PUT")) {
            this.bodyEnabled = true;
            if (this.vheader === false && this.vrespMapping === false) {
                this.vbody = true;
            }
        } else {
            this.bodyEnabled = false;
            this.vbody = false;

        }
    }

}