const Cast = require('../util/cast');
const Timer = require('../util/timer');
const getMonitorIdForBlockWithArgs = require('../util/get-monitor-id');

class Boundlo1SensingBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The "answer" block value.
         * @type {string}
         */
        this._answer = '';

        /**
         * The timer utility.
         * @type {Timer}
         */
        this._timer = new Timer();

        /**
         * The stored microphone loudness measurement.
         * @type {number}
         */
        this._cachedLoudness = -1;

        /**
         * The time of the most recent microphone loudness measurement.
         * @type {number}
         */
        this._cachedLoudnessTimestamp = 0;

        /**
         * The list of queued questions and respective `resolve` callbacks.
         * @type {!Array}
         */
        this._questionList = [];

        this.runtime.on('ANSWER', this._onAnswer.bind(this));
        this.runtime.on('PROJECT_START', this._resetAnswer.bind(this));
        this.runtime.on('PROJECT_STOP_ALL', this._clearAllQuestions.bind(this));
        this.runtime.on('STOP_FOR_TARGET', this._clearTargetQuestions.bind(this));
        this.runtime.on('RUNTIME_DISPOSED', this._resetAnswer.bind(this));
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            sensing_touchingobject: this.touchingObject,
            sensing_touchingcolor: this.touchingColor,
            sensing_coloristouchingcolor: this.colorTouchingColor,
            sensing_distanceto: this.distanceTo,
            sensing_timer: this.getTimer,
            sensing_resettimer: this.resetTimer,
            sensing_of: this.getAttributeOf,
            sensing_mousex: this.getMouseX,
            sensing_mousey: this.getMouseY,
            sensing_setdragmode: this.setDragMode,
            sensing_mousedown: this.getMouseDown,
            sensing_keypressed: this.getKeyPressed,
            sensing_current: this.current,
            sensing_sensor: this.sensor,
            sensing_sensorpressed: this.sensorPressed,
            sensing_dayssince2000: this.daysSince2000,
            sensing_loudness: this.getLoudness,
            sensing_loud: this.isLoud,
            sensing_askandwait: this.askAndWait,
            sensing_answer: this.getAnswer,
            sensing_username: this.getUsername,
            sensing_userid: this.getUserId,
            sensing_turbomode: this.getTurbo,
            sensing_setturbomode: this.setTurbo,
            sensing_draggable: this.isDraggable,
            sensing_os: this.getOperatingSystem,
            sensing_browser: this.getBrowser,
            sensing_loggedin: this.isLoggedIn,
            sensing_objectname: this.getObjName,
            sensing_online: this.isOnline,
            sensing_mobile: this.isMobile,
            sensing_behind: this.behind
        };
    }

    getMonitored () {
        return {
            sensing_answer: {
                getId: () => 'answer'
            },
            sensing_loudness: {
                getId: () => 'loudness'
            },
            sensing_loud: {
                getId: () => 'is loud?'
            },
            sensing_loggedin: {
                getId: () => 'logged in?'
            },
            sensing_objectname: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_objectname`
            },
            sensing_online: {
                getId: () => 'online?'
            },
            sensing_mobile: {
                getId: () => 'mobile?'
            },
            sensing_browser: {
                getId: () => 'browser'
            },
            sensing_turbomode: {
                getId: () => 'turbo mode?'
            },
            sensing_userid: {
                getId: () => 'userid'
            },
            sensing_draggable: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_draggable`
            },
            sensing_os: {
                getId: () => 'operating system'
            },
            sensing_timer: {
                getId: () => 'timer'
            },
            sensing_current: {
                // This is different from the default toolbox xml id in order to support
                // importing multiple monitors from the same opcode from sb2 files,
                // something that is not currently supported in scratch 3.
                getId: (_, fields) => getMonitorIdForBlockWithArgs('current', fields) // _${param}`
            }
        };
    }

    behind (args, util) {
        const st = this.runtime.getSpriteTargetByName(Cast.toString(args.OBJMENU));
        if (!st) return;
        const stl = Cast.toNumber(st.getLayerOrder());
        const ct = util.target;
        const ctl = Cast.toNumber(ct.getLayerOrder());
        if (ctl < stl) {
            return true;
        } else {
            return false;
        }
    }

    _onAnswer (answer) {
        this._answer = answer;
        const questionObj = this._questionList.shift();
        if (questionObj) {
            const [_question, resolve, target, wasVisible, wasStage] = questionObj;
            // If the target was visible when asked, hide the say bubble unless the target was the stage.
            if (wasVisible && !wasStage) {
                this.runtime.emit('SAY', target, 'say', '');
            }
            resolve();
            this._askNextQuestion();
        }
    }

    _resetAnswer () {
        this._answer = '';
    }

    _enqueueAsk (question, resolve, target, wasVisible, wasStage) {
        this._questionList.push([question, resolve, target, wasVisible, wasStage]);
    }

    _askNextQuestion () {
        if (this._questionList.length > 0) {
            const [question, _resolve, target, wasVisible, wasStage] = this._questionList[0];
            // If the target is visible, emit a blank question and use the
            // say event to trigger a bubble unless the target was the stage.
            if (wasVisible && !wasStage) {
                this.runtime.emit('SAY', target, 'say', question);
                this.runtime.emit('QUESTION', '');
            } else {
                this.runtime.emit('QUESTION', question);
            }
        }
    }

    _clearAllQuestions () {
        this._questionList = [];
        this.runtime.emit('QUESTION', null);
    }

    _clearTargetQuestions (stopTarget) {
        const currentlyAsking = this._questionList.length > 0 && this._questionList[0][2] === stopTarget;
        this._questionList = this._questionList.filter(question => (
            question[2] !== stopTarget
        ));

        if (currentlyAsking) {
            this.runtime.emit('SAY', stopTarget, 'say', '');
            if (this._questionList.length > 0) {
                this._askNextQuestion();
            } else {
                this.runtime.emit('QUESTION', null);
            }
        }
    }

    askAndWait (args, util) {
        const _target = util.target;
        return new Promise(resolve => {
            const isQuestionAsked = this._questionList.length > 0;
            this._enqueueAsk(String(args.QUESTION), resolve, _target, _target.visible, _target.isStage);
            if (!isQuestionAsked) {
                this._askNextQuestion();
            }
        });
    }

    getTurbo () {
        return this.runtime.turboMode;
    }

    isDraggable (args, util) {
        return util.target.draggable;
    }

    getAnswer () {
        return this._answer;
    }

    touchingObject (args, util) {
        return util.target.isTouchingObject(args.TOUCHINGOBJECTMENU);
    }

    touchingColor (args, util) {
        const color = Cast.toRgbColorList(args.COLOR);
        return util.target.isTouchingColor(color);
    }

    colorTouchingColor (args, util) {
        const maskColor = Cast.toRgbColorList(args.COLOR);
        const targetColor = Cast.toRgbColorList(args.COLOR2);
        return util.target.colorIsTouchingColor(targetColor, maskColor);
    }

    distanceTo (args, util) {
        if (util.target.isStage) return 10000;

        let targetX = 0;
        let targetY = 0;
        if (args.DISTANCETOMENU === '_mouse_') {
            targetX = util.ioQuery('mouse', 'getScratchX');
            targetY = util.ioQuery('mouse', 'getScratchY');
        } else {
            args.DISTANCETOMENU = Cast.toString(args.DISTANCETOMENU);
            const distTarget = this.runtime.getSpriteTargetByName(
                args.DISTANCETOMENU
            );
            if (!distTarget) return 10000;
            targetX = distTarget.x;
            targetY = distTarget.y;
        }

        const dx = util.target.x - targetX;
        const dy = util.target.y - targetY;
        return Math.sqrt((dx * dx) + (dy * dy));
    }

    setDragMode (args, util) {
        util.target.setDraggable(args.DRAG_MODE === 'draggable');
    }

    setTurbo (args, util) {
        this.runtime.setTurboMode(args.TURBO === "on");
    }

    getTimer (args, util) {
        return util.ioQuery('clock', 'projectTimer');
    }

    resetTimer (args, util) {
        util.ioQuery('clock', 'resetProjectTimer');
    }

    getMouseX (args, util) {
        return util.ioQuery('mouse', 'getScratchX');
    }

    getMouseY (args, util) {
        return util.ioQuery('mouse', 'getScratchY');
    }

    getMouseDown (args, util) {
        return util.ioQuery('mouse', 'getIsDown');
    }

    getObjName (args, util) {
        return util.target.sprite.name;
    }

    current (args) {
        const menuOption = Cast.toString(args.CURRENTMENU).toLowerCase();
        const date = new Date();
        switch (menuOption) {
        case 'year': return date.getFullYear();
        case 'month': return date.getMonth() + 1; // getMonth is zero-based
        case 'date': return date.getDate();
        case 'dayofweek': return date.getDay() + 1; // getDay is zero-based, Sun=0
        case 'hour': return date.getHours();
        case 'minute': return date.getMinutes();
        case 'second': return date.getSeconds();
        }
        return 0;
    }

    getKeyPressed (args, util) {
        return util.ioQuery('keyboard', 'getKeyIsDown', [args.KEY_OPTION]);
    }

    daysSince2000 () {
        const msPerDay = 24 * 60 * 60 * 1000;
        const start = new Date(2000, 0, 1); // Months are 0-indexed.
        const today = new Date();
        const dstAdjust = today.getTimezoneOffset() - start.getTimezoneOffset();
        let mSecsSinceStart = today.valueOf() - start.valueOf();
        mSecsSinceStart += ((today.getTimezoneOffset() - dstAdjust) * 60 * 1000);
        return mSecsSinceStart / msPerDay;
    }

    getLoudness () {
        if (typeof this.runtime.audioEngine === 'undefined') return -1;
        if (this.runtime.currentStepTime === null) return -1;

        // Only measure loudness once per step
        const timeSinceLoudness = this._timer.time() - this._cachedLoudnessTimestamp;
        if (timeSinceLoudness < this.runtime.currentStepTime) {
            return this._cachedLoudness;
        }

        this._cachedLoudnessTimestamp = this._timer.time();
        this._cachedLoudness = this.runtime.audioEngine.getLoudness();
        return this._cachedLoudness;
    }

    isLoud () {
        return this.getLoudness() > 10;
    }

    getAttributeOf (args) {
        let attrTarget;

        if (args.OBJECT === '_stage_') {
            attrTarget = this.runtime.getTargetForStage();
        } else {
            args.OBJECT = Cast.toString(args.OBJECT);
            attrTarget = this.runtime.getSpriteTargetByName(args.OBJECT);
        }

        // attrTarget can be undefined if the target does not exist
        // (e.g. single sprite uploaded from larger project referencing
        // another sprite that wasn't uploaded)
        if (!attrTarget) return 0;

        // Generic attributes
        if (attrTarget.isStage) {
            switch (args.PROPERTY) {
            // Scratch 1.4 support
            case 'background #': return attrTarget.currentCostume + 1;

            case 'backdrop #': return attrTarget.currentCostume + 1;
            case 'backdrop name':
                return attrTarget.getCostumes()[attrTarget.currentCostume].name;
            case 'volume': return attrTarget.volume;
            case 'last backdrop (number)': return attrTarget.getCostumes().length;
            case 'last backdrop (name)': return attrTarget.getCostumes().at(-1).name;
            case 'name': return attrTarget.sprite.name;
            }
        } else {
            switch (args.PROPERTY) {
            case 'x position': return attrTarget.x;
            case 'y position': return attrTarget.y;
            case 'direction': return attrTarget.direction;
            case 'costume #': return attrTarget.currentCostume + 1;
            case 'costume name':
                return attrTarget.getCostumes()[attrTarget.currentCostume].name;
            case 'size': return attrTarget.size;
            case 'volume': return attrTarget.volume;
            case 'clones amount': return attrTarget.sprite.clones.length - 1;
            case 'last costume (number)': return attrTarget.getCostumes().length;
            case 'last costume (name)': return attrTarget.getCostumes().at(-1).name;
            case 'visible': return attrTarget.visible;
            case 'layer': return attrTarget.getLayerOrder();
            case 'name': return attrTarget.sprite.name;
            }
        }

        // Target variables.
        const varName = args.PROPERTY;
        const variable = attrTarget.lookupVariableByNameAndType(varName, '', true);
        if (variable) {
            return variable.value;
        }

        // Otherwise, 0
        return 0;
    }

    getUsername (args, util) {
        return util.ioQuery('userData', 'getUsername');
    }

    getOperatingSystem (args, util) {
        const userOsuncompiled = window.navigator.userAgent.toString().toLowerCase();
        if (userOsuncompiled.includes('cros') || userOsuncompiled.includes('chrome os')) {
            return "Chrome OS";
        } else if (userOsuncompiled.includes('android')) {
            return "Android";
        } else if (userOsuncompiled.includes('ios')) {
            return "iOS";
        } else if (userOsuncompiled.includes('macos')) {
            return 'MacOS';
        } else if (userOsuncompiled.includes('windows')) {
            return "Windows";
        } else if (userOsuncompiled.includes('linux')) {
            return "Linux";
        } else {
            return "Unknown OS";
        }
    }

    getBrowser (args, util) {
        const userBrowseruncompiled = window.navigator.userAgent.toString().toLowerCase();
        if (userBrowseruncompiled.includes('opera gx')) {
            return "Opera GX";
        } else if (userBrowseruncompiled.includes('opera') || userBrowseruncompiled.includes('opr')) {
            return "Opera";
        } else if (userBrowseruncompiled.includes('edg')) {
            return "Edge";
        } else if (userBrowseruncompiled.includes('chrome') && !userBrowseruncompiled.includes('chrome os')) {
            return "Chrome";
        } else if (userBrowseruncompiled.includes('firefox')) {
            return 'Firefox';
        } else if (userBrowseruncompiled.includes('safari')) {
            return 'Safari';
        } else if (userBrowseruncompiled.includes('msie')) {
            return "Internet Explorer";
        } else if (userBrowseruncompiled.includes('navigator')) {
            return "Netscape Navigator";
        } else {
            return "Unknown Browser";
        }
    }

    isLoggedIn (args, util) {
        const gotusername = util.ioQuery('userData', 'getUsername').replaceAll(" ", "");
        if (gotusername == "") {
            return false;
        } else {
            return true;
        }
    }

    getUserId (args, util) {
        return 1; //simulate userid type s##t
    }

    isOnline (args, util) {
        return navigator.onLine;
    }

    isMobile (args, util) {
        const identifier = window.navigator.userAgent || window.opera;
        if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(identifier)) {
            return true;
        }
        return false;
    }

    sensor (args, util) {
        //extension ran on flash, cant readd it
        return 0
    }

    sensorPressed (args, util) {
        //extension ran on flash, cant readd it
        return false
    }
}

module.exports = Boundlo1SensingBlocks;
