import { Channel, Socket } from 'phoenix-channels'

export async function init(url): Promise<HomesynckConnection> {
    let connection: HomesynckConnection = await new Promise((resolve,reject)=>{
        let socket = new Socket(url);
        socket.connect();

        socket.onOpen(() => {
            resolve(new HomesynckConnection(socket));
        });

        socket.onError(_error => {
            reject("connection error");
        });
    });
    return connection;
}

export class HomesynckConnection {
    
    socket: Socket;
    credentials: {user_id?: string, auth_token?: string};

    constructor(socket) {
        this.socket = socket;
        this.credentials = {};
    }

    async login(credentials) {
        let channel:Channel = await new Promise((resolve, reject) => {
            let channel = this.socket.channel("auth:lobby", {});
            channel.join()
                .receive("ok", _resp => {
                    resolve(channel);
                })
                .receive("error", _err => {
                    reject("couldn't join auth:lobby channel");
                });
        })
        let resp = await new Promise((resolve, reject) => {
            channel.push("login", credentials)
                .receive("ok", resp => {
                    resolve(resp);
                })
                .receive("error", _err => {
                    reject("couldn't login with "+JSON.stringify(credentials));
                });
        })

        this.credentials.user_id = resp["user_id"];
        this.credentials.auth_token = resp["auth_token"];
        
        return this;
    }

    async openOrCreateDirectory(name, config:any = {}): Promise<HomesynckDirectory> {
        let directory = new HomesynckDirectory(this, name, false, config);
        await directory.create();
        return directory;
    }

    async openOrCreateSecureDirectory(name, password, config:any = {}): Promise<HomesynckDirectory> {
        config.password = password;
        let directory = new HomesynckDirectory(this, name, true, config);
        await directory.create();
        return directory;
    }
}

export class HomesynckDirectory {
    connection: HomesynckConnection;
    name: string;
    is_secured: boolean;
    description: string;
    thumbnail_url: string;
    password: string;
    id: number;
    state: any;
    initialState: any;
    channel: Channel;
    received_updates: number[];
    onUpdateReceivedCallback: any;

    constructor(connection, name, is_secured, {description, thumbnail_url, password}) {
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

    async create() {
        const {name, is_secured, description, thumbnail_url, password} = this;
        const {socket, credentials} = this.connection;

        const channel:any = await new Promise((resolve,reject) => {  
            const channel = socket.channel("directories:lobby", credentials);
            channel.join()
                .receive("ok", _resp => {
                    resolve(channel);
                })
                .receive("error", _reason => {
                    reject("couldn't join directories:lobby channel");
                });
        });

        const resp = await new Promise((resolve, reject) => {
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
                    reject("couldn't create or open directory "+JSON.stringify(credentials));
                });
        });

        this.id = resp["directory_id"];
        return this;
    }

    async startSyncing() {
        const {id, password, received_updates} = this;
        const {socket, credentials} = this.connection;

        const channel:any = await new Promise((resolve,reject) => {  
            const channel = socket.channel("sync:"+id, {
                ...credentials,
                directory_password: password,
                received_updates: received_updates
            });
            channel.join(5000)
                .receive("ok", resp => {
                    resolve(channel);
                })
                .receive("error", _reason => {
                    reject("couldn't join sync:"+id+" channel");
                });
        });

        channel.on("updates", payload => {
            payload.updates.forEach((update) => {
                this.received_updates.push(update["rank"]);
                this.received_updates.sort(function(a, b) {
                    return a - b;
                });
                this.state = this.onUpdateReceivedCallback(
                    {
                        instructions: update["instructions"],
                        rank: update["rank"]
                    }, 
                    JSON.parse(JSON.stringify(this.state))
                );
            });
        });

        this.channel = channel;
        return this;
    }

    async pushInstructions(instructions) {
        const {received_updates, channel} = this;

        let rank = received_updates[received_updates.length - 1] + 1;
        if(received_updates.length == 0) {
            rank = 1;
        }

        const resp = await new Promise((resolve, reject) => {
            channel.push("push_update", {
                rank: rank,
                instructions: JSON.stringify(instructions),
            })
                .receive("ok", resp => {   
                    resolve(resp);
                })
                .receive("error", err => {
                    resolve(null);
                });
        });

        return this;
    }

    setInitialState(initialState) {
        this.initialState = initialState;
        return this;
    }

    onUpdateReceived(callback: (update: {instructions:string, rank:number}, state: any) => any) {
        this.onUpdateReceivedCallback = callback;
        return this;
    }
}