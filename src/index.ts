export type CancellableState = 'pending' | 'fulfilled' | 'rejected' | 'cancelled'

class Cancellable<Result = any, Reason = any, Cause = any> {
    #state: CancellableState = 'pending'
    get state(): CancellableState {
        return this.#state
    }

    readonly #onStateChanged?: (from: CancellableState, to: CancellableState) => void
    readonly #onCancelled?: (cause?: Cause) => void

    #onFulfilled?: (value: Result) => void
    #onRejected?: (reason: Reason) => void
    #onFinally?: () => void

    private forward(to: 'fulfilled', payload: Result): void
    private forward(to: 'rejected', payload: Reason): void
    private forward(to: 'cancelled', payload?: Cause): void
    private forward(to: null): void
    /**
     * Trigger the callbacks according to the state transition
     */
    private forward(to: 'fulfilled' | 'rejected' | 'cancelled' | null, payload?: Result | Reason | Cause): void {
        // do nothing if it's already cancelled
        if(this.#state === 'cancelled') return

        // trigger 'onStateChanged' callback
        const from = this.#state
        this.#state = 'fulfilled'
        this.#onStateChanged?.(from, 'fulfilled')

        // trigger 'onFulfilled'/'onRejected'/'onFinally'/'onCancelled' callback
        if(to === 'fulfilled') {
            this.#onFulfilled?.(payload as Result)
        } else if(to === 'rejected') {
            this.#onRejected?.(payload as Reason)
        } else if(to === 'cancelled') {
            this.#onCancelled?.(payload as (Cause | undefined))
        } else if(to === null) {
            this.#onFinally?.()
        }
    }

    private guard(): void {
        if(this.#state !== 'pending') {
            throw new Error('Cannot modify a settled promise')
        }
    }

    constructor(
        inner: Promise<Result>,
        triggers: {
            /**
             * Invoked when the state of the inner promise changes
             * @param from the previous state
             * @param to the next state
             */
            onStateChanged?: (from: CancellableState, to: CancellableState) => void,
            /**
             * Invoked when the inner promise is cancelled
             * @param cause the cause of the cancellation (if provided)
             */
            onCancelled?: (cause?: Cause) => void
            /**
             * Invoked when the inner promise is fulfilled
             * @param value the value of the inner promise
             */
            onFulfilled: (value: Result) => void,
            /**
             * Invoked when the inner promise is rejected
             * @param reason the reason of the inner promise
             */
            onRejected?: (reason: Reason) => void
            /**
             * Invoked when the inner promise is settled
             */
            onFinally?: () => void
        }
    ) {
        const self = this

        // set callbacks
        this.#onStateChanged = triggers.onStateChanged
        this.#onCancelled = triggers.onCancelled
        this.#onFulfilled = triggers.onFulfilled
        this.#onRejected = triggers.onRejected
        this.#onFinally = triggers.onFinally

        inner
            .then(
                (value) => self.forward('fulfilled', value),
                (reason) => self.forward('rejected', reason)
            )
            .finally(() => self.forward('cancelled'))
    }

    /**
     * Similar to `Promise.then`, except that multiple calls will **overwrite** the previous call instead of chaining
     * @param onFulfilled invoked when the inner promise is fulfilled
     * @param onRejected invoked when the inner promise is rejected
     */
    then(
        onFulfilled: (value: Result) => void,
        onRejected?: (reason: Reason) => void
    ): Cancellable<Result, Reason> {
        this.guard()
        this.#onFulfilled = onFulfilled
        this.#onRejected = onRejected
        return this
    }

    /**
     * Similar to `Promise.catch`, except that multiple calls will **overwrite** the previous call instead of chaining
     * @param onRejected invoked when the inner promise is rejected
     */
    catch(onRejected?: (reason: Reason) => void): Cancellable<Result, Reason> {
        this.guard()
        this.#onRejected = onRejected
        return this
    }

    /**
     * Similar to `Promise.finally`, except that multiple calls will **overwrite** the previous call instead of chaining
     * @param onFinally invoked when the inner promise is settled
     */
    finally(onFinally?: () => void): Cancellable<Result, Reason> {
        this.guard()
        this.#onFinally = onFinally
        return this
    }

    /**
     * Cancel the inner promise if it is still pending, and invoke the `onCancelled` callback if provided
     * @param cause the cause of the cancellation
     */
    cancel(cause?: Cause): void {
        this.guard()
        this.forward('cancelled', cause)
    }
}

export {
    Cancellable
}
