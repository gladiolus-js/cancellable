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

const task = new Cancellable(
    createTask(3000),
    {
        onCancelled: (cause) => {
            console.log("This will be called when task is cancelled, and the cause is:", cause);
        },
        onFinally: () => {
            console.log("This will never be called cause task is cancelled before it is resolved");
        }
    }
);

setTimeout(() => {
    task.cancel('Task cancelled by user in 1 second');
}, 1000)