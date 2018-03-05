// ==UserScript==
// @name         MOOMOO.IO AUTOHEAL -- WORKING AFTER PATCH
// @namespace    -
// @version      2.2
// @description  Autoheal
// @author       Night
// @match        *://moomoo.io/*
// @match        http://dev.moomoo.io/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/msgpack5/4.0.1/msgpack5.js
// ==/UserScript==



var ws;
var MYID;
var hasApple = true;
var foodInHand = false;
var autoheal = true;

document.title = "Moo Moo -- Autoheal ON";

function encodeSEND(json){
    let OC = msgpack5().encode(json);
        var aAdd = Array.from(OC);
        aAdd.unshift(4);
        return new Uint8Array(aAdd).buffer;
}

WebSocket.prototype.oldSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(m){
    this.oldSend(m);
    let x = new Uint8Array(m);
    let realData = msgpack5().decode(x.slice(1, x.length));
    console.log(realData.data[0]);
    if (realData.data[0]=="5"){
        if (realData.data[1] == 0 || realData.data[1] == 1) foodInHand = !foodInHand;
        console.log(`Food in hand: ${foodInHand}`);

    }
    if (!ws){
        ws = this;
        socketFound(this);
    }
};

function socketFound(socket){
    socket.addEventListener('message', function(message){
        handleMessage(message);
    });
}

function isElementVisible(e) {
    return (e.offsetParent !== null);
}


function heal(){
    console.log("HERE I AM IN THE HEAL FUNC.");
    var dataTemplate = {"type": 2, "data":[], "options":{"compress":false}, "nsp": "/"};
    if (hasApple){
        if (!haveApple()){
            heal();
            return;
        }
        else { //User has apple
            var data2 = dataTemplate;
            data2['data'] = ["5", 0, null];
            ws.send(encodeSEND(data2));

        }
    }
    else { //User has cookie
        console.log('user has cookie');
            var data2 = dataTemplate;
            data2['data'] = ["5", 1, null];
            ws.send(encodeSEND(data2));
    }
    dataTemplate["data"]=["4", 1, null];
    let encoded = encodeSEND(dataTemplate);
    ws.send(encoded);

}

function handleMessage(m){
    let td = new Uint8Array(m.data);
    var info = msgpack5().decode(td.slice(1, td.length)).data;

    if (info[0] == "1" && !MYID){
        MYID =  info[1];
    }

     console.log(info[0]);
    if (info[0] == "10" && info[1] == MYID && autoheal){
        if (info[2] < 100 && info[2] > 0){
       console.log("RECEIVED:");
        console.log(info);
       setTimeout( () => {
           heal();
       }, 150);
        } else if (info[2] > 0) {
            var dataTemplate = {"type": 2, "data":[], "options":{"compress":false}, "nsp": "/"};
             dataTemplate["data"]=["4", 0, null];
            let encoded = encodeSEND(dataTemplate);
            ws.send(encoded);
        } else {
            hasApple = true; //You've died tragically in combat; back to the apple for you!
        }
    }
    else if(info[0] == "11"){
        hasApple = true;
    }

}

function haveApple(){
    if (hasApple) hasApple = isElementVisible(document.getElementById("actionBarItem11"));
    return hasApple;
}

document.addEventListener('keypress', (e)=>{
   if (e.keyCode == 116 && document.activeElement.id.toLowerCase() !== 'chatbox'){
        autoheal = !autoheal;
       document.title = "Moo Moo -- Autoheal " + (autoheal ? "ON" : "OFF");
   }
});