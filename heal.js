// ==UserScript==
// @name         Moomoo.io Automatic Bull Helmet & AutoHeal Mod! DESTROY SERVERS EASILY with this!
// @namespace    -
// @version      5.1
// @description  Autoheal
// @author       Cloudy#9558
// @match        *://moomoo.io/*
// @match        http://dev.moomoo.io/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/msgpack5/4.0.1/msgpack5.js
// ==/UserScript==

const autoHealSpeed = 150; //Bigger number = SLOWER autoheal; fastest is 0

const START_SSWX = [4, 132, 164, 116, 121, 112, 101, 2, 164, 100, 97, 116, 97, 147, 161, 52, 1, 192, 167, 111, 112, 116, 105, 111, 110, 115, 129, 168, 99, 111, 109, 112, 114, 101, 115, 115, 195, 163, 110, 115, 112, 161, 47];
const END_SSWX = [4, 132, 164, 116, 121, 112, 101, 2, 164, 100, 97, 116, 97, 147, 161, 52, 0, 192, 167, 111, 112, 116, 105, 111, 110, 115, 129, 168, 99, 111, 109, 112, 114, 101, 115, 115, 195, 163, 110, 115, 112, 161, 47];

const APPLE = [4, 132, 164, 116, 121, 112, 101, 2, 164, 100, 97, 116, 97, 147, 161, 53, 0, 212, 0, 0, 167, 111, 112, 116, 105, 111, 110, 115, 129, 168, 99, 111, 109, 112, 114, 101, 115, 115, 195, 163, 110, 115, 112, 161, 47];
const COOKIE = [4, 132, 164, 116, 121, 112, 101, 2, 164, 100, 97, 116, 97, 147, 161, 53, 1, 212, 0, 0, 167, 111, 112, 116, 105, 111, 110, 115, 129, 168, 99, 111, 109, 112, 114, 101, 115, 115, 195, 163, 110, 115, 112, 161, 47];

var currentHat = 0;
var IN_PROCESS = false;
var justDied = false;
var recentHealth = 100;
var ws;
var MYID;
var hasApple = true;
var foodInHand = false;
var autoheal = true;
var autobull = false;
var STATE = 0;

document.title = "Heal ON / Bull Hat OFF";

function encodeSEND(json){
    let OC = msgpack5().encode(json);
        var aAdd = Array.from(OC);
        aAdd.unshift(4);
        return new Uint8Array(aAdd).buffer;
}

function bullHelmet(status){
    var dataTemplate = {"data":[], "options":{"compress":false}, "nsp": "/", "type": 2};
    dataTemplate["data"]= ["13", 0, status == "on" ? 7 : currentHat, 0];
    //console.log(dataTemplate["data"]);
    let encoded = encodeSEND(dataTemplate);
    return encoded;
}


WebSocket.prototype.oldSend = WebSocket.prototype.send;
WebSocket.prototype.send = function(m){
    if (!ws){
        ws = this;
        console.log("WS SET");
        socketFound(this);
    }
    let x = new Uint8Array(m);

    let x_arr_SSX = Array.from(x);
    if (x_arr_SSX.length === 43 && autobull){
         if (x_arr_SSX.every( (num, idx) => START_SSWX[idx]==num )){
             console.log("started swing");
             IN_PROCESS = true;
             this.oldSend(bullHelmet("on"));
         } else if (x_arr_SSX.every( (num, idx) => END_SSWX[idx]==num ) ){
             console.log("ended swing");
             this.oldSend(bullHelmet("off"));
             IN_PROCESS = false;
         }
    }

    this.oldSend(m);
    /*let usageArray = Array.from(new Uint8Array(m));
    if (usageArray.length == 45){
        if (usageArray[16] == 0 || usageArray[16] == 1) foodInHand = false;
        console.log(`Food in hand: ${foodInHand}`);

    };*/
    let realData = msgpack5().decode(x.slice(1, x.length));
    if (realData.data[0]=="1"){
      console.log("user respawned");
       justDied = false;
    } else if (realData.data[0]=="13"){
        if (!IN_PROCESS && realData.data.length == 4 && realData.data[3]==0 &&realData.data[1]==0){
            currentHat = realData.data[2];
            console.log("Changed hat to " + currentHat);

        }

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
    if (recentHealth>=100) return;
    console.log(recentHealth);
    console.log(`HERE I AM IN THE HEAL FUNC with ${hasApple}`);
    var dataTemplate = {"data":[], "options":{"compress":false}, "nsp": "/", "type": 2};
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

    recentHealth += hasApple ? 20 : 40;

}

function handleMessage(m){
    let td = new Uint8Array(m.data);
    //console.log(td);
    //console.log(td.slice(98,-1));
    var info = msgpack5().decode(td.slice(1, td.length)).data;


    if (info[0] == "1" && !MYID){
        MYID =  info[1];
    }

    if (info[0] == "10" && info[1] == MYID && autoheal){
          console.log("doing stuff");
        console.log(info);
        if (info[2] < 100 && info[2] > 0){
       recentHealth = info[2];
       console.log("RECEIVED:");
        console.log(info);
        //recentHealth += hasApple ? 20 : 40;
       console.log("heal notif sent");
       setTimeout( () => {
           heal();
       }, autoHealSpeed);
        } else if (info[2] > 0) {
            console.log("done healing");
            recentHealth = 100;
            if (foodInHand){
               console.log("okay bad thing happened");
             var dataTemplate5 = {"type": 2, "data":[], "options":{"compress":false}, "nsp": "/"};
             dataTemplate5["data"]=["5", 0, null];
             let encoded5 = encodeSEND(dataTemplate5);
             ws.send(encoded5);
                console.log("corrected bad thing");
            }

        } else {
            hasApple = true; //You've died tragically in combat; back to the apple for you!
            console.log("Setting has apple to true from here");
        }
    }
    else if(info[0] == "11"){
        console.log("doing death");
        hasApple = true;
        justDied = true;
        recentHealth = 100;

    }

}

function haveApple(){
    console.log("Im being used and justDied is:" + justDied);
    if (justDied){
        hasApple = true;
        return true;
    }
    if (hasApple) hasApple = isElementVisible(document.getElementById("actionBarItem11"));
    return hasApple;
}

document.addEventListener('keypress', (e)=>{
   if (e.keyCode == 116 && document.activeElement.id.toLowerCase() !== 'chatbox'){
       STATE+=1;
       let coreIndex = STATE%4;
       let truthArray = [ [1,2].includes(coreIndex), [0,1].includes(coreIndex)];
       autobull = truthArray[0];
       autoheal = truthArray[1];
       document.title = "Heal " + (autoheal ? "ON" : "OFF") + " / Bull Hat " + (autobull ? "ON" : "OFF");
   }
});