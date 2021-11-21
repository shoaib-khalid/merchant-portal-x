import { Component } from '@angular/core';
import { ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Output, EventEmitter } from '@angular/core';

/**
 * @title Basic menu
 */
@Component({
    styleUrls: ['./menu-options.component.css'],
    selector: 'menu-options',
    templateUrl: 'menu-options.component.html',
})
export class MenuOptionsComponent {
    @ViewChild('clickmenu') menu: MatMenuTrigger;
    @Output() open: EventEmitter<any> = new EventEmitter();


    constructor() {
    }
    ngAfterViewInit() {

    }
    openit() {
        this.menu.openMenu();
    }
    menuClicked() {
        this.open.emit('TEXT_MESSAGE');
    }
    actionClicked() {
        this.open.emit("ACTION");

    }
    conditionClicked() {
        this.open.emit("CONDITION");
    }
    quickReplyClicked() {
        this.open.emit("IMMEDIATE_TEXT_MESSAGE");
    }
    handOverClicked() {
        this.open.emit("HANDOVER");
    }
}