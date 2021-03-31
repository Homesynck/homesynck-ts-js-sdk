// TYPESCRIPT EQUIVALENT TO ./main.js

import { init } from "homesynck-sdk"

const URL = "http://localhost:4000/socket";

async function main() {
    let connection = await init(URL)
    
    await connection.login({
        login: "admin",
        password: "superpassword"
    })

    let directory = await connection.openOrCreateDirectory("Test")

    directory.onUpdateReceived(({instructions, rank}, state) => {
        console.log(instructions) //logging the received message body
        console.log(rank) //logging the received message rank

        return state; //returning state unchanged
    })

    await directory.startSyncing()

    await directory.pushInstructions("HELLO HOMESYNCK")
    await directory.pushInstructions("my first message")
    await directory.pushInstructions("my second message")
}

main()