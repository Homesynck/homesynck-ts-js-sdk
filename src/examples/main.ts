import { HomesynckDirectory, init } from "../lib"

const URL = "http://localhost:4000/socket";

async function main() {
    let bigMatrix = [];

    for(let x = 0; x < (1920 * 1080 * 3); x++) {
        bigMatrix.push(1);
    }

    console.log("matrix created");

    let connection = await init(URL)
    
    await connection.login({
        login: "admin",
        password: "superpassword"
    })

    let directory = await connection.openOrCreateDirectory(`Test:${Math.random()}`)
    
    directory.onUpdateReceived(mySplendidReactiveFunction)

    await directory.startSyncing()

    while(true) {
        await directory.pushInstructions(bigMatrix)
    }
}

function mySplendidReactiveFunction(update:{instructions:string, rank:number}, state:any) {

    if(update.rank % 100 == 0) {
        console.log(`[${update.rank}]: ~${update.rank} 1920*1080px images sent`)
    }

    return state;
}

main()