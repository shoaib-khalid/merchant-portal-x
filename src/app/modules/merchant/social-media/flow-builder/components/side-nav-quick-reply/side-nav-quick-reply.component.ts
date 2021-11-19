import { Component, OnInit } from '@angular/core';
import { ApiCallsService } from '../../../../services/api-calls.service'
import { HelperService } from '../../../../services/helper.service';
import { JsonCodec } from 'src/app/helpers/json-codec';
import { Helper } from '../../../../helpers/graph-helper';

@Component({
  selector: 'app-side-nav-quick-reply',
  templateUrl: './side-nav-quick-reply.component.html',
  styleUrls: ['./side-nav-quick-reply.component.css']
})
export class SideNavQuickReplyComponent implements OnInit {
  opened: boolean;
  pinned: boolean = false;
  title: any;
  description: any = "";

  constructor(private apiCalls: ApiCallsService,private helper:Helper, 
    private helperService: HelperService) { }

  ngOnInit(): void {
  }

  toggle() {

    this.description = this.getDescriptionOfVertex();

    if (this.opened) {

    } else {
        this.opened = true;

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
    if (this.helperService.vertexClicked() === "IMMEDIATE_TEXT_MESSAGE") {
        if (event.target.id.includes("header") || event.target.id.includes("card")) {
            var id = event.target.id;
            var text = (<HTMLInputElement>document.getElementById("header" + id.match(/\d/g)[0])).innerHTML;
            (<HTMLInputElement>document.getElementById("quick-reply-title")).value = text;
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

descriptionFocusOut(event) {
    // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1));

}

descriptionChange(event) {
    var strDigit = this.getStrDigit();
    const digit = this.helper.digitFromString(strDigit);
    document.getElementById("initial-message" + digit).textContent = event.target.value;
}

getStrDigit() {
    if (this.helper.v1.div.firstChild.id) {
        return this.helper.v1.div.firstChild.id;
    } else {
        return this.helper.v1.div.firstChild.nextElementSibling.id;
    }
}
getDescriptionOfVertex() {
    var strDigit = this.getStrDigit();
    const digit = this.helper.digitFromString(strDigit);
    return document.getElementById("initial-message" + digit).textContent;
}


titleFocusOut(event) {
    // this.apiCalls.autoSaveUpdate(JsonCodec.getIndividualJson(this.helper.v1))

  }
}
