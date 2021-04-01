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
        let bigMatrix = [];
        for (let x = 0; x < (1920 * 1080 * 3); x++) {
            bigMatrix.push(1);
        }
        console.log("matrix created");
        let connection = yield lib_1.init(URL);
        yield connection.login({
            login: "admin",
            password: "superpassword"
        });
        let directory = yield connection.openOrCreateDirectory(`Test:${Math.random()}`);
        directory.onUpdateReceived(mySplendidReactiveFunction);
        yield directory.startSyncing();
        while (true) {
            yield directory.pushInstructions(bigMatrix);
        }
    });
}
function mySplendidReactiveFunction(update, state) {
    if (update.rank % 100 == 0) {
        console.log(`[${update.rank}]: ~${update.rank} 1920*1080px images sent`);
    }
    return state;
}
main();
