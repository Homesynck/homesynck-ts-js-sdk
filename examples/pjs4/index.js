import homesynck from "homesynck-sdk"
import kleur from 'kleur'
import prompts from 'prompts'
import dotenv from "dotenv";

dotenv.config()

async function main() {
    let connection = await homesynck.init(process.env.HOMESYNCK_URL)

    console.clear()

    let resp = await prompts([{
        type: 'text',
        name: 'nom',
        message: `Name: `
    },
    {
        type: 'text',
        name: 'dir',
        message: `Dir: `
    }])
    
    const nom = resp.nom
    
    await connection.login({
        login: process.env.HOMESYNCK_USERNAME,
        password: process.env.HOMESYNCK_PASSWORD
    })

    let directory = await connection.openOrCreateDirectory(`${resp.dir}`)
    
    directory.onUpdateReceived(({instructions, rank}, state) => {
        if(rank % 1 == 0) {
            if(instructions.includes(nom)) {
                console.log(kleur.bgBlue(`✅ Sent a message - rank: ${rank}, payload: ${instructions}`))
            } else {
                console.log(kleur.bgMagenta(kleur.black(`⏬ Received a message - rank: ${rank}, payload: ${instructions}`)))
            }
        }
        return state
    })

    await directory.startSyncing()

    let shift = Math.random() * 4
    let i = 0

    while(true) {
        await directory.pushInstructions(`Hello from ${nom}!`);
        sleep((Math.sin((i+shift)/4)+2)*10)
        i++
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

main()