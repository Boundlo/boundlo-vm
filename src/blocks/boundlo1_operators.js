const Cast = require('../util/cast.js');
const MathUtil = require('../util/math-util.js');

class Boundlo1OperatorsBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    _shuffle(ua) {
        var a = ua.split('')
        let ci = a.length;
        while (ci != 0) {
            let ri = Math.floor(Math.random() * ci);
            ci--;
            [a[ci], a[ri]] = [ a[ri], a[ci]];
        }
        if (Cast.toString(ua) == Cast.toString(Cast.toNumber(ua))) {
            return parseFloat(a.reverse().join('')) * Math.sign(Cast.toNumber(ua)); 
        } else {
            return a.join('')
        }
    }

    _isprime(un) {
        var cn = un != 1;
        for (var i = 2; i < un; i++) {
            if (un % i == 0) {
                cn = false;
                break;
            }
        }
        return cn;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            operator_true: this.truebool,
            operator_false: this.falsebool,
            operator_pi: this.pival,
            operator_infinity: this.infval,
            operator_euler: this.eulerval,
            operator_add: this.add,
            operator_subtract: this.subtract,
            operator_multiply: this.multiply,
            operator_divide: this.divide,
            operator_exponent: this.exponent,
            operator_lt: this.lt,
            operator_ltoet: this.ltoet,
            operator_mlt: this.mlt,
            operator_equals: this.equals,
            operator_notequals: this.notequals,
            operator_gt: this.gt,
            operator_gtoet: this.gtoet,
            operator_mgt: this.mgt,
            operator_and: this.and,
            operator_nand: this.nand,
            operator_or: this.or,
            operator_nor: this.nor,
            operator_xor: this.xor,
            operator_xnor: this.xnor,
            operator_not: this.not,
            operator_random: this.random,
            operator_join: this.join,
            operator_letter_of: this.letterOf,
            operator_length: this.length,
            operator_contains: this.contains,
            operator_mod: this.mod,
            operator_round: this.round,
            operator_mathop: this.mathop,
            operator_to: this.to,
            operator_is: this.is,
            operator_casesensitive: this.caseSensitive
        };
    }

    remainderAfterDivision (args, util) {

    }

    caseSensitive (args, util) {

    }

    to (args, util) {
        if (args.VAL1 === null) return;
        const v = args.VAL1;
        switch (args.PROPERTY) {
        case 'number': return Cast.toNumber(v);
        case 'positive': return Math.abs(Cast.toNumber(v));
        case 'negative': return -Math.abs(Cast.toNumber(v));
        case 'boolean': return Cast.toBoolean(v);
        case 'string': return Cast.toString(v);
        case 'uppercase': return Cast.toString(v).toUpperCase();
        case 'lowercase': return Cast.toString(v).toLowerCase();
        case 'reversed': {
            if (Cast.toString(v) == Cast.toString(Cast.toNumber(v))) {
                return parseFloat(Cast.toString(v).split('').reverse().join('')) * Math.sign(Cast.toNumber(v));
            }
            return Cast.toString(v).split('').reverse('').join('');
        }
        case 'shuffled': {
            return this._shuffle(v);
        }
        }
        return 'NaN';
    }

    is (args, util) {
        if (args.VAL1 === null) return;
        const v = args.VAL1;
        const vs = Cast.toString(v);
        const vn = Cast.toNumber(v);
        switch (args.PROPERTY) {
        case 'number': return (vs == Cast.toString(vn));
        case 'positive': return !(vs.charAt(0) === '-');
        case 'negative': return (vs.charAt(0) === '-');
        case 'integer': return ((vs == Cast.toString(vn)) && isFinite(vn) && (Math.floor(vn) === vn));
        case 'prime number': return this._isprime(vn);
        case 'even number': return (vn % 2 == 0);
        case 'odd number': return !(vn % 2 == 0)
        case 'boolean': return Cast.toBoolean((vs === 'true') || (vs === 'false'));
        case 'string': return typeof v === 'string';
        case 'uppercase': return (vs === vs.toUpperCase());
        case 'lowercase': return (vs === vs.toLowerCase());
        }
        return 'NaN';
    }

    add (args) {
        return Cast.toNumber(args.NUM1) + Cast.toNumber(args.NUM2);
    }

    subtract (args) {
        return Cast.toNumber(args.NUM1) - Cast.toNumber(args.NUM2);
    }

    multiply (args) {
        return Cast.toNumber(args.NUM1) * Cast.toNumber(args.NUM2);
    }

    divide (args) {
        return Cast.toNumber(args.NUM1) / Cast.toNumber(args.NUM2);
    }

    exponent (args, util) {
        return Cast.toNumber(args.NUM1) ^ Cast.toNumber(args.NUM2);
    }

    lt (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) < 0;
    }

    ltoet (args) {
        return Cast.toBoolean(Cast.toNumber(args.OPERAND1) <= Cast.toNumber(args.OPERAND2));
    }

    mlt (args) {
        const n1 = Cast.toNumber(args.OPERAND1)
        return ((n1 < Cast.toNumber(args.OPERAND2)) && (n1 < Cast.toNumber(args.OPERAND3)));
    }

    equals (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) === 0;
    }

    notequals (args) {
        return !(Cast.compare(args.OPERAND1, args.OPERAND2) === 0);
    }

    gt (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) > 0;
    }

    gtoet (args) {
        return Cast.toBoolean(Cast.toNumber(args.OPERAND1) >= Cast.toNumber(args.OPERAND2));
    }

    mgt (args) {
        const n1 = Cast.toNumber(args.OPERAND1)
        return ((n1 > Cast.toNumber(args.OPERAND2)) && (n1 > Cast.toNumber(args.OPERAND3)));
    }

    and (args) {
        return Cast.toBoolean(args.OPERAND1) && Cast.toBoolean(args.OPERAND2);
    }

    nand (args) {
        return !(Cast.toBoolean(args.OPERAND1) && Cast.toBoolean(args.OPERAND2));
    }

    or (args) {
        return Cast.toBoolean(args.OPERAND1) || Cast.toBoolean(args.OPERAND2);
    }

    nor (args) {
        return !(Cast.toBoolean(args.OPERAND1) || Cast.toBoolean(args.OPERAND2));
    }

    xor (args) {
        return Cast.toBoolean(args.OPERAND1) !== Cast.toBoolean(args.OPERAND2);
    }

    xnor (args) {
        return !!Cast.toBoolean(args.OPERAND1) === !!Cast.toBoolean(args.OPERAND2);
    }

    not (args) {
        return !Cast.toBoolean(args.OPERAND);
    }

    random (args) {
        const nFrom = Cast.toNumber(args.FROM);
        const nTo = Cast.toNumber(args.TO);
        const low = nFrom <= nTo ? nFrom : nTo;
        const high = nFrom <= nTo ? nTo : nFrom;
        if (low === high) return low;
        // If both arguments are ints, truncate the result to an int.
        if (Cast.isInt(args.FROM) && Cast.isInt(args.TO)) {
            return low + Math.floor(Math.random() * ((high + 1) - low));
        }
        return (Math.random() * (high - low)) + low;
    }

    join (args) {
        return Cast.toString(args.STRING1) + Cast.toString(args.STRING2);
    }

    letterOf (args) {
        const index = Cast.toNumber(args.LETTER) - 1;
        const str = Cast.toString(args.STRING);
        // Out of bounds?
        if (index < 0 || index >= str.length) {
            return '';
        }
        return str.charAt(index);
    }

    length (args) {
        return Cast.toString(args.STRING).length;
    }

    contains (args) {
        const format = function (string) {
            return Cast.toString(string).toLowerCase();
        };
        return format(args.STRING1).includes(format(args.STRING2));
    }

    mod (args) {
        const n = Cast.toNumber(args.NUM1);
        const modulus = Cast.toNumber(args.NUM2);
        let result = n % modulus;
        // Scratch mod uses floored division instead of truncated division.
        if (result / modulus < 0) result += modulus;
        return result;
    }

    round (args) {
        return Math.round(Cast.toNumber(args.NUM));
    }

    mathop (args) {
        const operator = Cast.toString(args.OPERATOR).toLowerCase();
        const n = Cast.toNumber(args.NUM);
        switch (operator) {
        case 'abs': return Math.abs(n);
        case 'floor': return Math.floor(n);
        case 'ceiling': return Math.ceil(n);
        case 'sqrt': return Math.sqrt(n);
        case 'sin': return parseFloat(Math.sin((Math.PI * n) / 180).toFixed(10));
        case 'cos': return parseFloat(Math.cos((Math.PI * n) / 180).toFixed(10));
        case 'tan': return MathUtil.tan(n);
        case 'asin': return (Math.asin(n) * 180) / Math.PI;
        case 'acos': return (Math.acos(n) * 180) / Math.PI;
        case 'atan': return (Math.atan(n) * 180) / Math.PI;
        case 'ln': return Math.log(n);
        case 'log': return Math.log(n) / Math.LN10;
        case 'e ^': return Math.exp(n);
        case '10 ^': return Math.pow(10, n);
        }
        return 0;
    }

    truebool (args, util) {
        return true;
    }

    falsebool (args, util) {
        return false;
    }

    infval () {
        return "Infinity";
    }

    pival () {
        return Math.PI;
    }

    eulerval () {
        return Math.E;
    }

}

module.exports = Boundlo1OperatorsBlocks;
