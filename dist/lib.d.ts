import { Channel, Socket } from 'phoenix-channels';
export declare function init(url: any): Promise<HomesynckConnection>;
export declare class HomesynckConnection {
    socket: Socket;
    credentials: {
        user_id?: string;
        auth_token?: string;
    };
    constructor(socket: any);
    login(credentials: any): Promise<this>;
    openOrCreateDirectory(name: any, config?: any): Promise<HomesynckDirectory>;
    openOrCreateSecureDirectory(name: any, password: any, config?: any): Promise<HomesynckDirectory>;
}
export declare class HomesynckDirectory {
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
    constructor(connection: any, name: any, is_secured: any, { description, thumbnail_url, password }: {
        description: any;
        thumbnail_url: any;
        password: any;
    });
    create(): Promise<this>;
    startSyncing(): Promise<this>;
    pushInstructions(instructions: any): Promise<this>;
    setInitialState(initialState: any): this;
    onUpdateReceived(callback: (update: {
        instructions: string;
        rank: number;
    }, state: any) => any): this;
}
