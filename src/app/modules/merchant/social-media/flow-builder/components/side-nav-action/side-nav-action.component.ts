import { Component } from '@angular/core';
import { JsonCodec } from 'app/modules/merchant/social-media/flow-builder/components/helpers/json-codec';
import { MatDialog } from '@angular/material/dialog';
import { GraphHelper } from 'app/modules/merchant/social-media/flow-builder/components/helpers/graph-helper';
import { HelperService } from 'app/modules/merchant/social-media/flow-builder/components/helpers/helper.service';
import { ActionDialog } from '../action-dialog/action-dialog.component';

@Component({
    selector: 'side-nav-action',
    templateUrl: './side-nav-action.component.html',
    styleUrls: ['./side-nav-action.component.css']
})
export class SideNavAction {

    opened: boolean = false;
    requestsArray: any = [];
    pinned: boolean = false;
    title: any;
    triggerText: any;
    dataVariable: any = "";


    constructor(
        private _graphHelper: GraphHelper, 
        private _helperService: HelperService, 
        public dialog: MatDialog
    ) {
    }

    titleChange(text) {
        var strDigit = this.getStrDigit();
        const digit = this._graphHelper.digitFromString(strDigit);
        document.getElementById("header" + digit).textContent = text;
    }

    removeRequest(i) {
        this._helperService.fetchExternalRequests().splice(i, 1);
        this.requestsArray.splice(i, 1);
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

    }

    handleClick(event) {

        if (this._helperService.vertexClicked() === "ACTION") {
            if (event.target.id.includes("header") || event.target.id.includes("card")) {
                var id = event.target.id;
                try{

                
                var text = (<HTMLInputElement>document.getElementById("header" + id.match(/\d/g)[0])).innerHTML;
                (<HTMLInputElement>document.getElementById("vertex-action-title")).value = text;
            }catch(ex){
                
            }
                this.opened = true;
                this.updateSidePanelWithButtons();
            } else if (event.target.localName === "svg") {
                if (this.pinned === false) {
                    this.opened = false;
                }
            }
        } else {
            this.opened = false;
        }
    }


    toggle() {

    }

    pin() {
        if (this.pinned) {
            this.pinned = false;
            alert("Unpinned")
        } else {
            this.pinned = true;
            alert("Pinned")
        }
    }
    titleFocusOut($event) {
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))
    }

    addRequest() {
        this.requestsArray.push("Add your request");
        this.insertIntoExternalRequests();
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

    }
    getStrDigit() {
        if (this._graphHelper.v1.div.firstChild.id) {
            return this._graphHelper.v1.div.firstChild.id;
        } else {
            return this._graphHelper.v1.div.firstChild.nextElementSibling.id;
        }
    }

    openActionDialog(event, i) {

        var data = this.requestParameters(i);
        const dialogRef = this.dialog.open(ActionDialog, {
            data: data

        });

        dialogRef.afterClosed().subscribe(result => {
            if (result != null) {
                const headers = this.convertHeadersToJson(result[2])
                this.requestsArray[i] = result[1];
                this._helperService.setExternalRequest({
                    type: "EXTERNAL_REQUEST",
                    externalRequest: {
                        url: result[1],
                        headers: headers
                        ,
                        httpMethod: result[0],
                        body: {
                            format: result[3],
                            payload: result[4]
                        },
                        response: {
                            format: result[6],
                            mapping: result[5]
                        },
                        errorStep: {
                            actionType: "vertex",
                            targetId: {
                                "$oid": "5fec54f9964cb3407cb3b918"
                            }
                        }
                    }
                }, i)
                // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))


            }

        });

    }

    requestParameters(i) {
        var data;
        const externalRequests = this._helperService.fetchExternalRequests();
        const oldHeaders = this.convertJsontoHeadersArray(externalRequests[i].externalRequest.headers);
        data = {
            reqType: externalRequests[i].externalRequest.httpMethod,
            url: externalRequests[i].externalRequest.url,
            reqheaders: oldHeaders,
            bodyFormat: externalRequests[i].externalRequest.body.format,
            bodyText: externalRequests[i].externalRequest.body.payload,
            reqMapping: externalRequests[i].externalRequest.response.mapping,
            responseMappingFormat: externalRequests[i].externalRequest.response.format
        }

        return data;
    }

    insertIntoExternalRequests() {

        this._helperService.insertExternalRequest({
            type: "EXTERNAL_REQUEST",
            externalRequest: {
                url: "",
                headers: [{ key: "", value: "" }]
                ,
                httpMethod: "",
                body: {
                    format: "",
                    payload: ""
                },
                response: {
                    format: "",
                    mapping: [{ path: "", dataVariable: "", optional: "" }]
                },
                errorStep: {
                    actionType: "vertex",
                    targetId: {
                        "$oid": "5fec54f9964cb3407cb3b918"
                    }
                }
            }
        })

    }

    updateSidePanelWithButtons() {
        const externalRequests = this._helperService.fetchExternalRequests();
        this.requestsArray = [];

        for (var i = 0; i < externalRequests.length; i++) {
            if (this.requestsArray[i]) {
                this.requestsArray[i] = externalRequests[i].externalRequest.url;
            } else {
                this.requestsArray.push(externalRequests[i].externalRequest.url)
            }
        }
    }

    convertHeadersToJson(reqHeaders) {
        var newHeaders = [];
        for (var i = 0; i < reqHeaders.length; i++) {
            newHeaders.push({name:reqHeaders[i].key,value:reqHeaders[i].value});
        }
        console.log(newHeaders)
        return newHeaders;
    }
    convertJsontoHeadersArray(newHeaders) {
        var oldHeaders = [];
        const keys = Object.keys(newHeaders);
        const values = Object.values(newHeaders);
        if (keys[0] === "0") {
            return [{ key: "", value: "" }]
        } else {

            for (var i = 0; i < keys.length; i++) {
                oldHeaders.push({ key: keys[i], value: values[i] })
            }

            return oldHeaders;
        }
    }
}