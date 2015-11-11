/**
 * Created by lja on 2015/11/20.
 */

var type = (function () {
    'use strict';

    var class2type = {},
        toString = class2type.toString;

    ('Boolean Number String Function Array Date RegExp Object Error').split(' ').forEach(function (name) {
        class2type['[object ' + name + ']'] = name.toLowerCase();
    });

    function isWindow(obj) {
        return obj !== null && obj.window && obj === obj.window;
    }

    function isFunction(obj) {
        return class2type[toString.call(obj)] === 'function';
    }

    function isDocument(obj) {
        return obj && obj.nodeType === obj.DOCUMENT_NODE;
    }

    function isObject(obj) {
        return class2type[toString.call(obj)] === 'object';
    }

    function isArray(obj) {
        return class2type[toString.call(obj)] === 'array';
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) &&
            Object.getPrototypeOf(obj) === Object.prototype;
    }

    return {
        isWindow: isWindow,
        isFunction: isFunction,
        isDocument: isDocument,
        isObject: isObject,
        isPlainObject: isPlainObject,
        isArray: isArray
    };
})();

var Jackey8 = (function (type) {
    'use strict';

    var J8,
        emptyArray = [],
        jackey8 = {},
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table, 'thead': table, 'tfoot': table,
            'td': tableRow, 'th': tableRow,
            '*': document.createElement('div')
        },
    // special attributes that should be get/set via method calls
        methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
        simpleSelectorRE = /^[\w-]*$/,//字母 数字 或者下划线，不包括空格
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,//tag reg
        readyRE = /complete|loaded|interactive/,
        htmlFragmentRE = /^\s*<(\w+|!)[^>]*>/;//html片段

    function filterNullArray(array) {
        return emptyArray.filter.call(array, function (item) {
            return item !== null;
        });
    }

    //decorate the __proto__ and selector
    //todo: __proto__ not supported on IE
    jackey8.decorateDom = function (dom, selector) {
        dom = dom || [];
        dom.__proto__ = J8.fn;//jshint ignore:line
        dom.selector = selector;
        return dom;
    };

    jackey8.createNodeByHtmlFragment = function (html, name, properties) {
        var dom, nodes, container;
        if (simpleSelectorRE.test(html)) {
            dom = J8(document.createElement(RegExp.$1));
        }

        if (!dom) {
            if (html.replace) {
                html = html.replace(tagExpanderRE, '<$1></$2>');
            }

            if (name === void 0) {
                name = htmlFragmentRE.test(html) && RegExp.$1;
            }

            if (!(name in containers)) {
                name = '*';
            }

            container = containers[name];
            container.innerHTML = '' + html;//add html fragment to dom, make it node
            dom = J8.each(emptyArray.slice.call(container.childNodes), function () {
                container.removeChild(this);
            });
        }

        if (type.isPlainObject(properties)) {
            nodes = J8(dom);
            J8.each(properties, function (key, value) {
                if (methodAttributes.indexOf(key) > -1) {
                    nodes[key](value);
                } else {
                    nodes.attr(key, value);
                }
            });
        }
    };

    /**
     * find selector in context
     * by id class and 复杂类型：ul li
     * @param context
     * @param selector
     */
    jackey8.queryDom = function (context, selector) {
        var found = [],
            maybeId = selector[0] === '#',
            maybeClass = selector[0] === '.',
            name = maybeId || maybeClass ? selector.slice(1) : selector,
            isSample = simpleSelectorRE.test(name);

        if (!type.isDocument(context)) {
            return found;
        }

        if (!isSample) {
            found = emptyArray.slice.call(context.querySelectorAll(selector));
        } else {
            if (maybeId) {
                found = context.getElementById(name);
                if (found) {
                    return [found];
                }
                return [];
            }

            if (maybeClass) {
                found = context.getElementsByClassName(name);
            } else {
                found = context.getElementsByTagName(name);
            }
        }

        return emptyArray.slice.call(found);
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
            if (selector[0] === '<' && htmlFragmentRE.test(selector)) {
                //todo:
                dom = jackey8.createNodeByHtmlFragment(selector, RegExp.$1, context);
                selector = null;
            }
            //如果有parent，则先找到parent,然后使用find去找到selector
            else if (context !== void 0) {
                J8(context).find(selector);
            }
            else {
                // 正常的选取
                // 1 id 2 class 3 复杂选取
                // 作用域为document，因为如果存在context，则执行$(conetxt).find(selector)
                dom = jackey8.queryDom(document, selector);
            }
        } else if (type.isFunction(selector)) {
            J8(document).ready(selector);
        } else if (selector instanceof jackey8.decorateDom) {
            return selector;
        } else if (type.isArray(selector)) {
            dom = filterNullArray(selector);
        } else if (type.isObject(selector)) {
            dom = [selector];
            selector = null;
        } else {
            dom = [];
        }

        return jackey8.decorateDom(dom, selector);
    };

    J8 = function (selector, context) {
        return jackey8.init(selector, context);
    };

    J8.each = function (elements, callback) {
        var i, key;
        if (type.isArray(elements)) {
            for (i = 0; i < elements.length; i++) {
                if (callback.call(elements[i], i, elements[i]) === false) {
                    return elements;
                }
            }
        } else {
            for (key in elements) {
                if (callback.call(elements[key], key, elements[key]) === false) {
                    return elements;
                }
            }
        }
        return elements;
    }

    J8.fn = {
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat,
        ready: function (callback) {
            if (readyRE.test(document.readyState) && document.body) {
                callback(J8);
            } else {
                //todo: need to test DOMContentLoaded in each browsers
                document.addEventListener('DOMContentLoaded', function () {
                    callback(J8);
                }, false);
                return this;
            }
        }
    };

    
    return J8;

})(type);

window.Jackey8 = Jackey8;

if (window.J8 === void 0) {
    window.J8 = Jackey8;
}
