"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const URL = "http://localhost:4000/socket";
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = yield lib_1.init(URL);
        yield connection.login({
            login: "admin",
            password: "superpassword"
        });
        let directory = yield connection.openOrCreateDirectory("Test");
        directory.setInitialState({
            value: 0
        });
        directory.onUpdateReceived(mySplendidReactiveFunction);
        yield directory.startSyncing();
        while (true) {
            yield pushRandomUpdates(directory);
        }
    });
}
function mySplendidReactiveFunction(update, state) {
    console.log("Received Update: \n" + JSON.stringify(update));
    let instructionsDecoded = JSON.parse(update.instructions);
    if (instructionsDecoded.type == "add") {
        state.value += instructionsDecoded.value;
    }
    else if (instructionsDecoded.type == "multiply") {
        state.value *= instructionsDecoded.value;
    }
    console.log(`[${update.rank}]: ` + JSON.stringify(state));
    return state;
}
function pushRandomUpdates(directory) {
    return __awaiter(this, void 0, void 0, function* () {
        if (Math.random() < 0.1) {
            yield directory.pushInstructions({
                type: "add",
                value: getRandomArbitrary(-100, 100)
            });
        }
        else if (Math.random() < 0.2) {
            yield directory.pushInstructions({
                type: "multiply",
                value: getRandomArbitrary(-10, 10)
            });
        }
        yield sleep(getRandomArbitrary(50, 100));
    });
}
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        new Promise(resolve => setTimeout(resolve, ms));
    });
}
main();
