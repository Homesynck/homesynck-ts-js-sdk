declare module "phoenix-channels" {
    export class Socket {
        constructor(url: string);
        connect(): void;
        onOpen(callback:() => void): void;
        onError(callback:(error:any) => void): void;
        channel(name:string, options:any): Channel;
    }

    export class Channel {
        join(timeout?:number): Channel;
        receive(event:string, callback:(resp:any) => void): Channel
        push(event:string, payload:any): Channel
    }
}