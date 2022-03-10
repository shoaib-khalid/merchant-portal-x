import { Component, ElementRef, HostBinding, HostListener, NgZone, OnDestroy, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';

@Component({
    selector     : 'app-rocket-chat',
    templateUrl  : './rocket-chat.component.html',
    styleUrls    : ['./rocket-chat.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs     : 'rocketChat'
})
export class RocketChatComponent implements OnInit
{
  

    /**
     * Constructor
     */
    constructor(
    )
    {
    }


    ngOnInit(){
        showChat(window, document, 'script', `https://support.symplified.it/livechat`);
    }
    

    
 
}

function showChat(w, d, s, u) {
    w.RocketChat = function (c) { w.RocketChat._.push(c) }; w.RocketChat._ = []; w.RocketChat.url = u;
    var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
    j.async = true; j.src = `https://support.symplified.it/livechat/rocketchat-livechat.min.js?_=201903270000`;
    h.parentNode.insertBefore(j, h);
}

