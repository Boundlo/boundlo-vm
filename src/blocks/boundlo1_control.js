const Cast = require('../util/cast');
const Thread = require('../engine/thread');

class Boundlo1ControlBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The "counter" block value. For compatibility with 2.0.
         * @type {number}
         */
        this._counter = 0;

        this.runtime.on('RUNTIME_DISPOSED', this.clearCounter.bind(this));
    }

    
    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            control_wait: this.wait,
            control_repeat: this.repeat,
            control_forever: this.forever,
            control_forever_if: this.foreverIf,
            control_if: this.if,
            control_if_else: this.ifElse,
            control_wait_until: this.waitUntil,
            control_repeat_until: this.repeatUntil,
            control_while: this.repeatWhile,
            control_all_at_once: this.allAtOnce,
            control_for_each: this.forEach,
            control_run_at_turbo_mode: this.runAtTurbo,
            control_break: this.breakOutLoop,
            control_stop: this.stop,
            control_is_clone: this.isClone,
            control_is_original: this.iAmOriginal,
            control_amount_of_all_clones: this.getAmountOfAllClones,
            control_amount_of_my_clones: this.getAmountOfMyClones,
            control_clone_id: this.getCloneId,
            control_create_clone_of: this.createClone,
            control_delete_clones_of: this.deleteClones,
            control_delete_clone_with_id: this.deleteCloneWithId,
            control_delete: this.delete,
            control_delete_this_clone: this.deleteClone,
            control_run_if: this.runIf,
            control_get_counter: this.getCounter,
            control_incr_counter: this.incrCounter,
            control_decr_counter: this.decrCounter,
            control_incr_counter_by: this.incrCounterBy,
            control_decr_counter_by: this.decrCounterby,
            control_modify_counter_to: this.modifyCounterto,
            control_clear_counter: this.clearCounter,
            control_new_thread: this.newThread,
            control_run_simultanously: this.runSimultanously,
            control_run_flag: this.runFlag,
            control_switch: this.switch,
            control_switch_combined_default: this.switchAndDefaultToIfNot,
            control_case: this.case,
            control_race: this.race,
            control_unless: this.unless,
            control_unless_else: this.unlessElse,
            control_chance: this.chance,
            control_chance_on_not: this.chanceOnNot,
            control_wait_or_until: this.waitOrUntil,
            control_unless_else_reporter: this.unlessElseReporter,
            control_if_else_reporter: this.ifElseReporter,
            control_as_object: this.asObject,
            control_stop_object: this.stopObject,
            control_try_to_do: this.tryToDo,
            control_wait_a_tick: this.waitATick,
            control_throw_error: this.throwError,
            control_error_reporter: this.errorReporter,
            control_continue: this.continueLoop
        };
    }

    getHats () {
        return {
            control_start_as_clone: {
                restartExistingThreads: false
            }
        };
    }

    continueLoop (args, util) {
        return 'not implemented';
    }

    errorReporter (args, util) {
        return 'not implemented';
    }

    asObject (args, util) {
        return 'not implemented';
    }

    stopObject (args, util) {
        return 'not implemented';
    }

    throwError (args, util) {
        return 'not implemented';
    }

    tryToDo (args, util) {
        return 'not implemented';
    }

    waitATick (_, util) {
        util.yieldTick();
    }

    switch (args, util) {
        const blkContainer = util.thread.blockContainer
        const blks = blkContainer._blocks
        const myBlockId = Object.entries(blks)[0].id
        const blkscripts = blkContainer._scripts
        const myBlocks = []
        Object.entries(blks).forEach((v,i) => {
            var currentparsearched = v[1]
            while (true) {
                if (currentparsearched && currentparsearched.parent) {
                    if (Cast.toString(currentparsearched.parent) == myBlockId) {
                        myBlocks[myBlocks.length + 1] = currentparsearched
                    }
                    currentparsearched = blks[currentparsearched.parent]
                } else {
                    break
                }
            }
        })
        myBlocks.forEach((v,i) => {
            const blk = v[1]
            console.log(blk)
        });
        console.log(myBlocks)
    }

    switchAndDefaultToIfNot (args, util) {
        return 'not implemented';
    }

    case (args, util) {
        return 'not implemented';
    }

    runAtTurbo (_, util) {
        //this block made me sh## in my head because of how long i was diagnosing this thinking 'bro it worked for all at once block why not this'
        this.runtime.setTurboMode(true);
        if (typeof util.stackFrame.loopCounter === 'undefined') {
            util.stackFrame.loopCounter = 1;
        }
        util.stackFrame.loopCounter--;
        if (util.stackFrame.loopCounter >= 0) {
            util.startBranch(1, true);
        } else {
            this.runtime.setTurboMode(false);
        }
    }

    newBranch (args, util) {
        return 'not implemented';
    }

    newThread (args, util) {
        const currentBlockId = util.thread.peekStack();
        const t = util.target;
        const branch1 = util.thread.target.blocks.getBranch(currentBlockId,1);
        if (branch1) {
            util.thread.requestScriptGlowInFrame = null;
            util.thread.blockGlowInFrame = null;
            util.stackFrame.status = null;
            var thread1 = this.runtime._pushThread(branch1, t, {stackClick: false, target: t});
            thread1.requestScriptGlowInFrame = null;
            thread1.blockGlowInFrame = null;
            util.thread.requestScriptGlowInFrame = null;
            util.thread.blockGlowInFrame = null;
            return;
        }
    }

    runSimultanously (_, util) {
        //most brain thinking in my entire life
        const currentBlockId = util.thread.peekStack();
        const t = util.target;
        const branch1 = util.thread.target.blocks.getBranch(currentBlockId,1);
        const branch2 = util.thread.target.blocks.getBranch(currentBlockId,2);
        if (branch1 && branch2) {
            util.thread.requestScriptGlowInFrame = false;
            util.thread.blockGlowInFrame = null;
            util.stackFrame.status = null;
            if (!util.stackFrame.savedthread1) {
                util.stackFrame.savedthread1 = this.runtime._pushThread(branch1, t, {stackClick: false, target: t});
            }
            if (!util.stackFrame.savedthread2) {
                util.stackFrame.savedthread2 = this.runtime._pushThread(branch2, t, {stackClick: false, target: t});
            }
            util.stackFrame.savedthread1.requestScriptGlowInFrame = false;
            util.stackFrame.savedthread2.requestScriptGlowInFrame = false;
            util.stackFrame.savedthread1.blockGlowInFrame = null;
            util.stackFrame.savedthread2.blockGlowInFrame = null;
            util.thread.requestScriptGlowInFrame = false;
            util.thread.blockGlowInFrame = null;
            util.stackFrame.status = null;
            if (!((util.stackFrame.savedthread1.status == Thread.STATUS_DONE) && (util.stackFrame.savedthread2.status == Thread.STATUS_DONE))) {
                util.yield();
            } else {
                return;
            }
        } else {
            return this.runtime._BoundloUserError('Error: E Block called \'run simultanously\' has section(s) with no blocks in them! (Otherwise replace the \'run simultanously\' E block with nothing.)');
        }
    }

    race (_, util) {
        const currentBlockId = util.thread.peekStack();
        const t = util.target;
        const branch1 = util.thread.target.blocks.getBranch(currentBlockId,1);
        const branch2 = util.thread.target.blocks.getBranch(currentBlockId,2);
        if (branch1 && branch2) {
            util.thread.requestScriptGlowInFrame = false;
            util.thread.blockGlowInFrame = null;
            util.stackFrame.status = null;
            if (!util.stackFrame.savedthread1) {
                util.stackFrame.savedthread1 = this.runtime._pushThread(branch1, t, {stackClick: false, target: t});
            }
            if (!util.stackFrame.savedthread2) {
                util.stackFrame.savedthread2 = this.runtime._pushThread(branch2, t, {stackClick: false, target: t});
            }
            util.stackFrame.savedthread1.requestScriptGlowInFrame = false;
            util.stackFrame.savedthread2.requestScriptGlowInFrame = false;
            util.stackFrame.savedthread1.blockGlowInFrame = null;
            util.stackFrame.savedthread2.blockGlowInFrame = null;
            util.thread.requestScriptGlowInFrame = false;
            util.thread.blockGlowInFrame = null;
            util.stackFrame.status = null;
            if (util.stackFrame.savedthread1.status == Thread.STATUS_DONE) {
                util.stackFrame.status = Thread.STATUS_DONE;
                util.stackFrame.savedthread2.status = Thread.STATUS_DONE;
                return;
            }
            if (util.stackFrame.savedthread2.status == Thread.STATUS_DONE) {
                util.stackFrame.status = Thread.STATUS_DONE;
                util.stackFrame.savedthread1.status = Thread.STATUS_DONE;
                return;
            }
            util.yield();
        } else {
            return this.runtime._BoundloUserError('Error: E Block called \'race\' has section(s) with no blocks in them! (Otherwise replace the \'race\' E block with nothing.)');
        }
    }

    runFlag () {
        this.runtime.greenFlag();
    }

    decrCounterby (args) {
        this._counter = this._counter - Cast.toNumber(args.NUM1);
    }

    incrCounterBy (args) {
        this._counter = this._counter + Cast.toNumber(args.NUM1);
    }

    modifyCounterto (args) {
        this._counter = Cast.toNumber(args.NUM1);
    }

    repeat (args, util) {
        const times = Math.round(Cast.toNumber(args.TIMES));
        if (times <= 0) {
            return 'Error: Cannot repeat lower than 1'
        }
        // Initialize loop
        if (typeof util.stackFrame.loopCounter === 'undefined') {
            util.stackFrame.loopCounter = times;
        }
        // Only execute once per frame.
        // When the branch finishes, `repeat` will be executed again and
        // the second branch will be taken, yielding for the rest of the frame.
        // Decrease counter
        util.stackFrame.loopCounter--;
        // If we still have some left, start the branch.
        if (util.stackFrame.loopCounter >= 0) {
            util.startBranch(1, true);
        }
    }

    repeatUntil (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        // If the condition is false (repeat UNTIL), start the branch.
        if (!condition) {
            util.startBranch(1, true);
        }
    }

    repeatWhile (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        // If the condition is true (repeat WHILE), start the branch.
        if (condition) {
            util.startBranch(1, true);
        }
    }

    forEach (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);

        if (typeof util.stackFrame.index === 'undefined') {
            util.stackFrame.index = 0;
        }

        if (util.stackFrame.index < Number(args.VALUE)) {
            util.stackFrame.index++;
            variable.value = util.stackFrame.index;
            util.startBranch(1, true);
        }
    }

    breakOutLoop (_, util) {
        return 'not implemented'
    }

    waitUntil (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (!condition) {
            util.yield();
        }
    }

    forever (_, util) {
        util.startBranch(1, true);
    }

    wait (args, util) {
        if (util.stackTimerNeedsInit()) {
            const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

            util.startStackTimer(duration);
            this.runtime.requestRedraw();
            util.yield();
        } else if (!util.stackTimerFinished()) {
            util.yield();
        }
    }

    waitOrUntil (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            return;
        }
        if (util.stackTimerNeedsInit()) {
            if (condition) {
                return;
            }
            const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));

            util.startStackTimer(duration);
            this.runtime.requestRedraw();
            util.yield();
        } else if (!util.stackTimerFinished()) {
            if (condition) {
                return;
            }
            util.yield();
        }
    }

    if (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        }
    }

    ifElseReporter (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        const VAL1 = Cast.toString(args.ONTRUE);
        const VAL2 = Cast.toString(args.ONFALSE);
        if (condition) {
            return VAL1;
        } else {
            return VAL2;
        }
    }

    chance (args, util) {
        const percentage = Cast.toNumber(args.PERCENT) / 100;
        if (Math.random() < percentage) {
            util.startBranch(1, false);
        }
    }

    chanceOnNot (args, util) {
        const percentage = Cast.toNumber(args.PERCENT) / 100;
        if (Math.random() < percentage) {
            util.startBranch(1, false);
        } else {
            util.startBranch(2, false);
        }
    }

    unlessElseReporter (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        const VAL1 = Cast.toString(args.ONFALSE);
        const VAL2 = Cast.toString(args.ONTRUE);
        if (!!condition) {
            return VAL1;
        } else {
            return VAL2;
        }
    }

    unless (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (!condition) {
            util.startBranch(1, false);
        }
    }

    unlessElse (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (!condition) {
            util.startBranch(1, false);
        } else {
            util.startBranch(2, false);
        }
    }

    ifElse (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        } else {
            util.startBranch(2, false);
        }
    }

    runIfClone (_, util) {
        if (!(util.target.isOriginal)) {
            util.startBranch(1, false);
        }
    }

    runIfOriginal (_, util) {
        if (util.target.isOriginal) {
            util.startBranch(1, false);
        }
    }

    runIf (args, util) {
        const option = args.OPTS;
        if (option === 'original') {
            if (util.target.isOriginal) {
                util.startBranch(1, false);
            }
            return;
        } else {
            if (!util.target.isOriginal) {
                util.startBranch(1, false);
            }
            return;
        }
    }

    stop (args, util) {
        const option = args.STOP_OPTION;
        if (option === 'all') {
            util.stopAll();
        } else if (option === 'other scripts in sprite' ||
            option === 'other scripts in stage') {
            util.stopOtherTargetThreads();
        } else if (option === 'this script') {
            util.stopThisScript();
        }
    }

    createClone (args, util) {
        // Cast argument to string
        args.CLONE_OPTION = Cast.toString(args.CLONE_OPTION);

        // Set clone target
        let cloneTarget;
        if (args.CLONE_OPTION === '_myself_') {
            cloneTarget = util.target;
        } else {
            cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
        }

        // If clone target is not found, return
        if (!cloneTarget) return;

        // Create clone
        const newClone = cloneTarget.makeClone();
        if (newClone) {
            this.runtime.addTarget(newClone);

            // Place behind the original target.
            newClone.goBehindOther(cloneTarget);
        }
    }

    deleteClones (args, util) {
        args.CLONE_OPTION = Cast.toString(args.CLONE_OPTION);
        let cloneTarget;
        if ((args.CLONE_OPTION === '_myself_') && (!util.target.isStage)) {
            cloneTarget = util.target;
        } else {
            if (args.CLONE_OPTION == '_myself_') {
                return "Nuh uh uh, no breaking Blocklo today.";
            } else {
                cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
            }
        }
        if (!cloneTarget) return;
        const allClones = cloneTarget.sprite.clones;
        do {
            for (let i = 1; i < allClones.length; i++) {
                if (allClones[i].isOriginal) continue;
                var gott = this.runtime.targets[this.runtime.targets.indexOf(allClones[i])]
                this.runtime.disposeTarget(gott);
                this.runtime.stopForTarget(gott);
                //gott.dispose()
            }
        } while (!(allClones.length == 1))

    }

    delete (args, util) {
        const option = args.DELETE_OPTION;
        if (option === 'this clone') {
            if (util.target.isOriginal) return;
            this.runtime.disposeTarget(util.target);
            this.runtime.stopForTarget(util.target);
        } else if (option === 'other clones within parent') {
            if (util.target.isOriginal) return;
            const allTargets = this.runtime.targets
            const allClones = util.target.sprite.clones
            for (let i = 1; i < allClones.length; i++) {
                if (allClones[i].isOriginal) continue;
                var v = allClones.indexOf(util.target);
                var ti = allTargets.indexOf(allClones[i]);
                if ((i != v) && (ti > 0)) {
                    var gott = allTargets[ti];
                    this.runtime.disposeTarget(gott);
                    this.runtime.stopForTarget(gott);
                } else if (util.target.sprite.clones.length < 3) {
                    return;
                }
                continue;
            }
        } else if (option === 'other clones within experience') {
            if (util.target.isOriginal) return;
            const allTargets = this.runtime.targets
            for (let i = 0; i < allTargets.length; i++) {
                if (allTargets[i].isOriginal) continue;
                var v = allClones.indexOf(util.target);
                var gott = allTargets[i];
                if (i != v) {
                    this.runtime.disposeTarget(gott);
                    this.runtime.stopForTarget(gott);
                }
                continue;
            }
        } else if (option === 'all clones within experience') {
            const allTargets = this.runtime.targets
            for (let i = 0; i < allTargets.length; i++) {
                if (allTargets[i].isOriginal) continue;
                this.runtime.disposeTarget(allTargets[i]);
                this.runtime.stopForTarget(allTargets[i]);
            }
        }
    }

    deleteClone (_, util) {
        if (util.target.isOriginal) return;
        this.runtime.disposeTarget(util.target);
        this.runtime.stopForTarget(util.target);
    }

    deleteCloneWithId (args, util) {
        if (!args.CLONEID) return;
        if (Cast.toNumber(args.CLONEID) < 1) return "Bro thinks he is slick GET OUTTA HERE.";
        args.CLONE_OPTION = Cast.toString(args.CLONE_OPTION);
        let cloneTarget;
        if ((args.CLONE_OPTION === '_myself_') && (!util.target.isStage)) {
            cloneTarget = util.target;
        } else {
            if (args.CLONE_OPTION == '_myself_') {
                return "Nuh uh uh, no breaking Boundlo! today.";
            } else {
                cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
            }
        }
        if (!cloneTarget) return;
        const v = Cast.toNumber(args.CLONEID);
        const allTargets = this.runtime.targets
        const allClones = cloneTarget.sprite.clones
        for (let i = 1; i < allClones.length; i++) {
            if (allClones[i].isOriginal) continue;
            var ti = allTargets.indexOf(allClones[i]);
            if ((i == v) && (ti > 0)) {
                var gott = allTargets[ti];
                this.runtime.disposeTarget(gott);
                this.runtime.stopForTarget(gott);
                return;
            } else {
                continue;
            }
        }
    }

    getAmountOfMyClones (_, util) {
        if (util.target.isStage) return 0;
        return util.target.sprite.clones.length - 1;
    }

    isClone (_, util) {
        return !util.target.isOriginal;
    }

    iAmOriginal (_, util) {
        return util.target.isOriginal;
    }

    getCloneId (_, util) {
        if (util.target.isOriginal) return 0;
        if (util.target.isStage) return 0;
        return util.target.sprite.clones.indexOf(util.target);
    }

    getAmountOfAllClones (_, util) {
        return util.target.runtime._cloneCounter;
    }

    getCounter () {
        return this._counter;
    }

    clearCounter () {
        this._counter = 0;
    }

    incrCounter () {
        this._counter++;
    }

    decrCounter () {
        this._counter--;
    }

    allAtOnce (args, util) {
        var nsf = util.thread.peekStackFrame().reuse()
        nsf.warpMode = true;
        util.startBranch(1, false);
        nsf.warpMode = false;
    }

    foreverIf (args, util) {
        if (Cast.toBoolean(args.CONDITION)) {
            util.startBranch(1, true);
        } else {
            util.yield();
        }
    }
}

module.exports = Boundlo1ControlBlocks;
