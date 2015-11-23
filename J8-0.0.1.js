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

	function isPlainObject(obj) {
		return isObject(obj) && !isWindow(obj) &&
			Object.getPrototypeOf(obj) === Object.prototype;
	}

	return {
		isWindow: isWindow,
		isFunction: isFunction,
		isDocument: isDocument,
		isObject: isObject,
		isPlainObject: isPlainObject
	};
})();

var Jackey8 = (function (type) {
	'use strict';

	var J8,
		emptyArray = [],
		jackey8 = {},
		simpleSelectorRE = /^[\w-]*$/;//字母 数字 或者下划线，不包括空格

	//decorate the __proto__ and selector
	//todo: __proto__ not supported on IE
	jackey8.decorateDom = function (dom, selector) {
		dom = dom || [];
		dom.__proto__ = J8.fn;//jshint ignore:line
		dom.selector = selector;
		return dom;
	};

	/**
	 * find selector in context
	 * @param context
	 * @param selector
	 */
	jackey8.queryDom = function (context, selector) {
		var found = [],
			maybeId = selector[0] === '#',
			maybeClass = selector[0] === '.',
			name = maybeId || maybeClass ? selector.slice(1) : selector,
			isSample = simpleSelectorRE.test(name);

		if (!isDocument(context)) {
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
			if (selector[0] === '<') {
				//todo:
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


	return J8;


})(type);

window.Jackey8 = Jackey8;

if (window.J8 === void 0) {
	window.J8 = Jackey8;
}
