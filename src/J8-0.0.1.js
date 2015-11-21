/**
 * Created by lja on 2015/11/20.
 */
var Jackey8 = (function () {
    'use strict';

    var J8,
        emptyArray = [],
        jackey8 = {};

    //decorate the __proto__ and selector
    //todo: __proto__ not supported on IE
    jackey8.decorateDom = function (dom, selector) {
        dom = dom || [];
        dom.__proto__ = J8.fn;//jshint ignore:line
        dom.selector = selector;
        return dom;
    };

    //selector: empty string function object array and the instance of Jackey8
    jackey8.init = function (selector, context) {
        var dom;

        //if nothing given, return an empty collection
        if (!selector) {
            return jackey8.decorateDom();
        }

        if (typeof selector === 'string') {
            selector = selector.trim();

            //如果它是一个html片段，则创建一个节点
            //提示：在chrome21和Firefox15下面，
            // 如果不是<开头， 会抛错
            if (selector[0] === '<') {
                //todo:
            }
            //如果有parent，则先找到parent,然后使用find去找到selector
            else if (context !== void 0) {
                J8(context).find(selector);
            }
        }
    };

    J8 = function (selector, context) {
        return jackey8.init(selector, context);
    };

    J8.fn = {
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat
    };


})();

window.Jackey8 = Jackey8;

if (window.J8 === void 0) {
    window.J8 = Jackey8;
}
