import { HomesynckDirectory, init } from "homesynck-sdk"

const URL = "http://localhost:4000/socket";

async function main() {
    let connection = await init(URL)
    
    await connection.login({
        login: "admin",
        password: "superpassword"
    })

    let directory = await connection.openOrCreateDirectory("Test")
    
    directory.setInitialState({
        value: 0
    })

    directory.onUpdateReceived(mySplendidReactiveFunction)

    await directory.startSyncing()

    while(true) {
        await pushRandomUpdates(directory)
    }
}

function mySplendidReactiveFunction(update:{instructions:string, rank:number}, state:any) {
    console.log("Received Update: \n" + JSON.stringify(update))
    
    let instructionsDecoded:{
        type: string,
        value: number
    } = JSON.parse(update.instructions)

    if(instructionsDecoded.type == "add") {
        state.value += instructionsDecoded.value
    } else if(instructionsDecoded.type == "multiply") {
        state.value *= instructionsDecoded.value
    }
    
    console.log(`[${update.rank}]: ` + JSON.stringify(state))

    return state;
}

async function pushRandomUpdates(directory: HomesynckDirectory) {
    if(Math.random() < 0.1) {
        await directory.pushInstructions({
            type: "add",
            value: getRandomArbitrary(-100, 100)
        })
    } else if(Math.random() < 0.2) {
        await directory.pushInstructions({
            type: "multiply",
            value: getRandomArbitrary(-10, 10)
        })
    }

    await sleep(getRandomArbitrary(50, 100))
}

function getRandomArbitrary(min:number, max:number) {
    return Math.random() * (max - min) + min; 
}

async function sleep(ms:number) {
    new Promise(resolve => setTimeout(resolve, ms));
} 

main()