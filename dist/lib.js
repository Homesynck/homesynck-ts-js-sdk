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
exports.HomesynckDirectory = exports.HomesynckConnection = exports.init = void 0;
const phoenix_channels_1 = require("phoenix-channels");
function init(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = yield new Promise((resolve, reject) => {
            let socket = new phoenix_channels_1.Socket(url);
            socket.connect();
            socket.onOpen(() => {
                resolve(new HomesynckConnection(socket));
            });
            socket.onError(_error => {
                reject("connection error");
            });
        });
        return connection;
    });
}
exports.init = init;
class HomesynckConnection {
    constructor(socket) {
        this.socket = socket;
        this.credentials = {};
    }
    login(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            let channel = yield new Promise((resolve, reject) => {
                let channel = this.socket.channel("auth:lobby", {});
                channel.join()
                    .receive("ok", _resp => {
                    resolve(channel);
                })
                    .receive("error", _err => {
                    reject("couldn't join auth:lobby channel");
                });
            });
            let resp = yield new Promise((resolve, reject) => {
                channel.push("login", credentials, 50000)
                    .receive("ok", resp => {
                    resolve(resp);
                })
                    .receive("error", _err => {
                    reject("couldn't login with " + JSON.stringify(credentials));
                });
            });
            this.credentials.user_id = resp["user_id"];
            this.credentials.auth_token = resp["auth_token"];
            return this;
        });
    }
    openOrCreateDirectory(name, config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let directory = new HomesynckDirectory(this, name, false, config);
            yield directory.create();
            return directory;
        });
    }
    openOrCreateSecureDirectory(name, password, config = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            config.password = password;
            let directory = new HomesynckDirectory(this, name, true, config);
            yield directory.create();
            return directory;
        });
    }
}
exports.HomesynckConnection = HomesynckConnection;
class HomesynckDirectory {
    constructor(connection, name, is_secured, { description, thumbnail_url, password }) {
        this.connection = connection;
        this.name = name;
        this.is_secured = is_secured;
        this.description = description || "";
        this.thumbnail_url = thumbnail_url || "";
        this.password = password || "";
        this.id = -1;
        this.state = {};
        this.channel = undefined;
        this.received_updates = [];
    }
    create() {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, is_secured, description, thumbnail_url, password } = this;
            const { socket, credentials } = this.connection;
            const channel = yield new Promise((resolve, reject) => {
                const channel = socket.channel("directories:lobby", credentials);
                channel.join()
                    .receive("ok", _resp => {
                    resolve(channel);
                })
                    .receive("error", _reason => {
                    reject("couldn't join directories:lobby channel");
                });
            });
            const resp = yield new Promise((resolve, reject) => {
                channel.push("create", {
                    name: name,
                    is_secured: is_secured,
                    password: password,
                    description: description,
                    thumbnail_url: thumbnail_url,
                })
                    .receive("ok", resp => {
                    resolve(resp);
                })
                    .receive("error", err => {
                    reject("couldn't create or open directory " + JSON.stringify(credentials));
                });
            });
            this.id = resp["directory_id"];
            return this;
        });
    }
    startSyncing() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, password, received_updates } = this;
            const { socket, credentials } = this.connection;
            const channel = yield new Promise((resolve, reject) => {
                const channel = socket.channel("sync:" + id, Object.assign(Object.assign({}, credentials), { directory_password: password, received_updates: received_updates }));
                channel.join(5000)
                    .receive("ok", resp => {
                    resolve(channel);
                })
                    .receive("error", _reason => {
                    reject("couldn't join sync:" + id + " channel");
                });
            });
            channel.on("updates", payload => {
                payload.updates.forEach((update) => {
                    this.received_updates.push(update["rank"]);
                    this.received_updates.sort(function (a, b) {
                        return a - b;
                    });
                    this.state = this.onUpdateReceivedCallback({
                        instructions: update["instructions"],
                        rank: update["rank"]
                    }, JSON.parse(JSON.stringify(this.state)));
                });
            });
            this.channel = channel;
            return this;
        });
    }
    pushInstructions(instructions) {
        return __awaiter(this, void 0, void 0, function* () {
            const { received_updates, channel } = this;
            let rank = received_updates[received_updates.length - 1] + 1;
            if (received_updates.length == 0) {
                rank = 1;
            }
            const resp = yield new Promise((resolve, reject) => {
                channel.push("push_update", {
                    rank: rank,
                    instructions: instructions,
                }, 50000)
                    .receive("ok", resp => {
                    resolve(resp);
                })
                    .receive("error", err => {
                    resolve(null);
                });
            });
            return this;
        });
    }
    setInitialState(initialState) {
        this.initialState = initialState;
        return this;
    }
    onUpdateReceived(callback) {
        this.onUpdateReceivedCallback = callback;
        return this;
    }
}
exports.HomesynckDirectory = HomesynckDirectory;
