import { Cancellable } from "../dist/index.js";

/**
 * Create a task that will be resolved after a certain time
 * @param elapsedTime {number} - time in milliseconds
 * @return {Promise<void>}
 */
const createTask = (elapsedTime) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, elapsedTime);
    });
}

const task_fulfill = new Cancellable(
    createTask(2000),
    {
        onCancelled: (cause) => {
            console.log("This will be called when task is cancelled, and the cause is:", cause);
        },
        onFinally: () => {
            console.log("This will be called when task is finished");
        }
    }
);
task_fulfill.then(() => {
    console.log("This will be called when task is fulfilled");
})

// below will be printed in 2 seconds:
// => This will be called when task is fulfilled
// => This will be called when task is finished
//
// and the script will exit in 2 seconds.