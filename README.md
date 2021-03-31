# Homesynck SDK (Javascript & Typescript)
An easy API to harness the power of your [Homesynck server](https://github.com/Homesynck/homesynck-server).

![thumbnail](res/thumbnail.png)

# Installation
## Browser
Replacing `<VERSION>` by the version you want:

```html
<script src="https://cdn.jsdelivr.net/npm/homesynck-sdk@<VERSION>/browser/bundle.js"></script>
```

```js
const { init, HomesynckConnection, HomesynckDirectory } = require("homesynck-sdk");
```

## Node.js
```bash
npm i homesynck-sdk
```

```js
// If supported:
import { init, HomesynckConnection, HomesynckDirectory } from "homesynck-sdk";
// Otherwise
const { init, HomesynckConnection, HomesynckDirectory } = require("homesynck-sdk");
```

## Deno
Just do:

```js
import { init, HomesynckConnection, HomesynckDirectory } from "homesynck-sdk";
```

# Tutorial
**Step 1:** Init connection & login
```js
let connection = await init(URL)
    
await connection.login({
    login: "admin",
    password: "superpassword"
})
```

**Step 2:** Create the directory to sync into
```js
let directory = await connection.openOrCreateDirectory("Test")
```

**Step 3:** Set message received callback & start syncing
```js
directory.onUpdateReceived(({instructions, rank}, state) => {
    console.log(instructions) //logging the received message body
    console.log(rank) //logging the received message rank

    return state; //returning state unchanged
})

// Not yet receiving updates
await directory.startSyncing()
// Now receiving updates
```

**Step 4:** Send updates anytime you want!
```js
await directory.pushInstructions("HELLO HOMESYNCK")
```

But that's not all, Homesynck SDK can manage state for you!

**Optional 1:** Set initial state
```js
directory.setInitialState({
    value: 0
})
```

**Optional 2:** React to updates by changing state
```js
directory.onUpdateReceived(mySplendidReactiveFunction)

function mySplendidReactiveFunction(update, state) {
    console.log("Received Update: \n" + JSON.stringify(update))
    
    let instructionsDecoded = JSON.parse(update.instructions)

    if(instructionsDecoded.type == "add") {
        state.value += instructionsDecoded.value
    } else if(instructionsDecoded.type == "multiply") {
        state.value *= instructionsDecoded.value
    }
    
    console.log(`[${update.rank}]: ` + JSON.stringify(state))

    return state;
}

//You now need to put objects in your updates
await directory.pushInstructions({
    type: "add",
    value: 3.14
});

await directory.pushInstructions({
    type: "multiply",
    value: -42
});
```