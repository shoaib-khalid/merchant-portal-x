import { Component, OnInit } from '@angular/core';
import { JsonCodec } from 'src/app/helpers/json-codec';
import { Helper } from 'src/app/helpers/graph-helper';
import { ApiCallsService } from 'src/app/services/api-calls.service'
import { HelperService } from 'src/app//services/helper.service';

@Component({
    selector: 'side-nav-condition',
    templateUrl: './side-nav-condition.component.html',
    styleUrls: ['./side-nav-condition.component.css']
})
export class SideNavConditionComponent {
    opened: boolean;
    pinned: boolean = false;
    title: any;
    groups: any = [];
    conditions: any = {
        conditions: [
        ]
    };
    description: any;
    fieldNames: any;
    operator: any;
    currentVertexIndex: any;


    constructor(private apiCalls: ApiCallsService, private helper: Helper,
        private helperService: HelperService) {
    }

    toggle() {
        this.fieldNames = this.helperService.getAllDataVariables();
        console.log(this.fieldNames)
        if (this.opened) {
            this.description = this.getDescriptionOfVertex();
            this.currentVertexIndex = this.helperService.getVertexIndex();
            this.conditions.conditions = this.apiCalls.data[this.currentVertexIndex].conditions;
        } else {
            this.description = this.getDescriptionOfVertex();
            this.currentVertexIndex = this.helperService.getVertexIndex();
            this.opened = true;
            this.conditions.conditions = this.apiCalls.data[this.currentVertexIndex].conditions;

        }

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
    titleChange(text) {

        var strDigit = this.getStrDigit();
        const digit = this.helper.digitFromString(strDigit);
        document.getElementById("header" + digit).textContent = text;
    }

    handleClick(event) {
        if (this.helperService.vertexClicked() === "CONDITION") {
            if (event.target.id.includes("header") || event.target.id.includes("card")) {
                var id = event.target.id;
                var text = (<HTMLInputElement>document.getElementById("header" + id.match(/\d/g)[0])).innerHTML;
                (<HTMLInputElement>document.getElementById("condition-title")).value = text;
                this.toggle();
            } else if (event.target.localName === "svg") {
                if (this.pinned === false) {
                    this.opened = false;
                }
            }
        } else {
            this.opened = false;
        }
    }

    getStrDigit() {
        if (this.helper.v1.div.firstChild.id) {
            return this.helper.v1.div.firstChild.id;
        } else {
            return this.helper.v1.div.firstChild.nextElementSibling.id;
        }
    }


    titleFocusOut(event) {
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

    }
    valueFocusOut(event) {
        this.apiCalls.data[this.currentVertexIndex].conditions = this.conditions.conditions;
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));
    }
    addGroup(j) {
        this.conditions.conditions[j].groups.push({
            "field": "not selected",
            "match": "is",
            "caseSensitive": true,
            "value": ""
        })
        this.apiCalls.data[this.currentVertexIndex].conditions = this.conditions.conditions;
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

    }
    addCondition() {
        this.conditions.conditions.push({ operator: "AND", groups: [] })
        this.helper.addConditionUsingSidePanel();
        this.apiCalls.data[this.currentVertexIndex].conditions = this.conditions.conditions;
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));

    }

    fieldNameChange(event, j, i) {
        this.conditions.conditions[j].groups[i].field = event.target.value;
        this.apiCalls.data[this.currentVertexIndex].conditions = this.conditions.conditions;
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));

    }

    valueChange(event, j, i) {
        this.conditions.conditions[j].groups[i].value = event.target.value;
    }

    conditionChanged(event, j, i) {
        this.conditions.conditions[j].groups[i].match = event.target.value;
        this.apiCalls.data[this.currentVertexIndex].conditions = this.conditions.conditions;
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));

    }

    operatorChange(event, j) {
        this.conditions.conditions[j].operator = event.target.value;
        this.apiCalls.data[this.currentVertexIndex].conditions = this.conditions.conditions;
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));

    }
    descriptionFocusOut($event) {
        // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));
    }
    descriptionChange(event) {
        var strDigit = this.getStrDigit();
        const digit = this.helper.digitFromString(strDigit);
        document.getElementById("initial-message" + digit).textContent = event.target.value;
    }
    getDescriptionOfVertex() {
        var strDigit = this.getStrDigit();
        const digit = this.helper.digitFromString(strDigit);
        return document.getElementById("initial-message" + digit).textContent;
    }

}