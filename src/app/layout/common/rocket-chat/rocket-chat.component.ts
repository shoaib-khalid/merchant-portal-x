import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    selector     : 'app-rocket-chat',
    templateUrl  : './rocket-chat.component.html',
    styleUrls    : ['./rocket-chat.component.scss'],
    encapsulation: ViewEncapsulation.None,
    exportAs     : 'rocketChat'
})
export class RocketChatComponent implements OnInit,OnDestroy
{
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
    )
    {
    }
    
    
    ngOnInit(){
        
        if (localStorage.getItem("accessToken") !== null){
            showChat(window, document, 'script', `https://support.symplified.it/livechat`);
        }     

    }


    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    
}

function showChat(w:Window & typeof globalThis, d:Document, s:string, u:string) {
    (<any>w).RocketChat = function (c) { (<any>w).RocketChat._.push(c) }; (<any>w).RocketChat._ = []; (<any>w).RocketChat.url = u;
    var h = d.getElementsByTagName(s)[0], j = d.createElement(s);
    (<any>j).async = true; (<any>j).src = `https://support.symplified.it/livechat/rocketchat-livechat.min.js?_=201903270000`;
    h.parentNode.insertBefore(j, h);
}

