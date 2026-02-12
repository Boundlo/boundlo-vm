const Cast = require('../util/cast');

class Boundlo1EventBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.runtime.on('KEY_PRESSED', key => {
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: key
            });
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: 'any'
            });
        });
        this.runtime.on('RUNTIME_STEP_START', () => {
            this.runtime.startHats('event_while_is_true')
            this.runtime.startHats('event_every')
        })
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            event_whentouchingobject: this.touchingObject,
            event_broadcast: this.broadcast,
            event_broadcastandwait: this.broadcastAndWait,
            event_whengreaterthan: this.hatGreaterThanPredicate,
            event_when_is_true: this.whenIsTrue,
            event_while_is_true: this.whileIsTrue,
            event_isbroadcastreceived: this.isBroadcastReceived,
            event_every: this.every
        };
    }

    getHats () {
        return {
            event_whenflagclicked: {
                restartExistingThreads: true
            },
            event_whenstopclicked: {
                restartExistingThreads: true
            },
            event_always: {
                restartExistingThreads: true,
                edgeActivated: true
            },
            event_never: {
                restartExistingThreads: false
            },
            event_whenkeypressed: {
                restartExistingThreads: false
            },
            event_whenthisspriteclicked: {
                restartExistingThreads: true
            },
            event_whentouchingobject: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_whenstageclicked: {
                restartExistingThreads: true
            },
            event_whenbackdropswitchesto: {
                restartExistingThreads: true
            },
            event_whengreaterthan: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_whenbroadcastreceived: {
                restartExistingThreads: true
            },
            event_when_is_true: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_every: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_while_is_true: {
                restartExistingThreads: false,
                edgeActivated: true
            }
        };
    }

    every (args, util) {
        return 'not implemented';
    }

    touchingObject (args, util) {
        return util.target.isTouchingObject(args.TOUCHINGOBJECTMENU);
    }

    hatGreaterThanPredicate (args, util) {
        const option = Cast.toString(args.WHENGREATERTHANMENU).toLowerCase();
        const value = Cast.toNumber(args.VALUE);
        switch (option) {
        case 'timer':
            return util.ioQuery('clock', 'projectTimer') > value;
        case 'loudness':
            return this.runtime.audioEngine && this.runtime.audioEngine.getLoudness() > value;
        }
        return false;
    }

    broadcast (args, util) {
        const broadcastVar = util.runtime.getTargetForStage().lookupBroadcastMsg(
            args.BROADCAST_OPTION.id, args.BROADCAST_OPTION.name);
        if (broadcastVar) {
            const broadcastOption = broadcastVar.name;
            util.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: broadcastOption
            });
        }
    }

    isBroadcastReceived (args, util) {
        return 'not implemented';
    }

    broadcastAndWait (args, util) {
        if (!util.stackFrame.broadcastVar) {
            util.stackFrame.broadcastVar = util.runtime.getTargetForStage().lookupBroadcastMsg(
                args.BROADCAST_OPTION.id, args.BROADCAST_OPTION.name);
        }
        if (util.stackFrame.broadcastVar) {
            const broadcastOption = util.stackFrame.broadcastVar.name;
            // Have we run before, starting threads?
            if (!util.stackFrame.startedThreads) {
                // No - start hats for this broadcast.
                util.stackFrame.startedThreads = util.startHats(
                    'event_whenbroadcastreceived', {
                        BROADCAST_OPTION: broadcastOption
                    }
                );
                if (util.stackFrame.startedThreads.length === 0) {
                    // Nothing was started.
                    return;
                }
            }
            // We've run before; check if the wait is still going on.
            const instance = this;
            // Scratch 2 considers threads to be waiting if they are still in
            // runtime.threads. Threads that have run all their blocks, or are
            // marked done but still in runtime.threads are still considered to
            // be waiting.
            const waiting = util.stackFrame.startedThreads
                .some(thread => instance.runtime.threads.indexOf(thread) !== -1);
            if (waiting) {
                // If all threads are waiting for the next tick or later yield
                // for a tick as well. Otherwise yield until the next loop of
                // the threads.
                if (
                    util.stackFrame.startedThreads
                        .every(thread => instance.runtime.isWaitingThread(thread))
                ) {
                    util.yieldTick();
                } else {
                    util.yield();
                }
            }
        }
    }

    whenIsTrue (args, _) {
        const condition = Cast.toBoolean(args.CONDITION);
        return condition
    }

    whileIsTrue (args, util) {
        const cond = !!Cast.toBoolean(args.CONDITION);
        if (cond) {
            util.yieldTick()
        } else {
            util.startBranch(1, false);
        }
    }
}

module.exports = Boundlo1EventBlocks;
