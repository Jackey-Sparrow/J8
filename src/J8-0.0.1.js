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

	function isNumber(obj) {
		return class2type[toString.call(obj)] === 'number';
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
		isArray: isArray,
		isNumber: isNumber
	};
})();

var Jackey8 = (function (type) {
	'use strict';

	var J8,
		emptyArray = [],
		slice = emptyArray.slice,
		jackey8 = {},
		table = document.createElement('table'),
		tableRow = document.createElement('tr'),
		containers = {
			'tr': document.createElement('tbody'),
			'tbody': table, 'thead': table, 'tfoot': table,
			'td': tableRow, 'th': tableRow,
			'*': document.createElement('div')
		},
		elementDisplay = {},
	//special attributes that should be get/set via method calls
		methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
		simpleSelectorRE = /^[\w-]*$/,//字母 数字 或者下划线，不包括空格
		tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,//tag reg
		readyRE = /complete|loaded|interactive/,
		htmlFragmentRE = /^\s*<(\w+|!)[^>]*>/;//html片段

	//去除null的值
	function removeNullArray(array) {
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

	//通过html片段创建dom节点
	jackey8.createNodeByHtmlFragment = function (html, name, properties) {
		var dom, nodes, container;

		//如果是简单的标签，则直接创建元素
		if (simpleSelectorRE.test(html)) {
			dom = J8(document.createElement(RegExp.$1));
		}

		if (!dom) {
			if (html.replace) {
				html = html.replace(tagExpanderRE, '<$1></$2>');
			}

			//正则选取出标签名称
			if (name === void 0) {
				name = htmlFragmentRE.test(html) && RegExp.$1;
			}

			//为了区别标签是否为table内的元素
			// 'tr': document.createElement('tbody'),
			//'tbody': table, 'thead': table, 'tfoot': table,
			//'td': tableRow, 'th': tableRow
			//其他标签都使用div作为parentNode
			if (!(name in containers)) {
				name = '*';
			}

			container = containers[name];
			container.innerHTML = '' + html;//添加到parentNode，并实现转换成dom的过程
			dom = J8.each(slice.call(container.childNodes), function () {
				container.removeChild(this);//从parentNode中移除，并返回childNodes
			});
		}

		//methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
		//如果属性在上面中，则直接赋值，否则通过attr方法去赋值
		if (type.isPlainObject(properties)) {
			nodes = J8(dom);
			J8.each(properties, function (key, value) {
				if (methodAttributes.indexOf(key) > -1) {
					nodes[key](value);
				}
				else {
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

		//如果不是简单类型（复杂类型ul li a），使用querySelectorAll
		if (!isSample) {
			found = slice.call(context.querySelectorAll(selector));
		}
		else {
			if (maybeId) {
				found = context.getElementById(name);
				if (found) {
					return [found];
				}
				return [];
			}

			if (maybeClass) {
				found = context.getElementsByClassName(name);
			}
			else {
				found = context.getElementsByTagName(name);
			}
		}

		return slice.call(found);
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
				// 作用域为document，因为如果存在context，则执行J8(conetxt).find(selector)
				dom = jackey8.queryDom(document, selector);
			}
		}
		else if (type.isFunction(selector)) {
			J8(document).ready(selector);
		}
		else if (selector instanceof jackey8.decorateDom) {
			return selector;
		}
		else if (type.isArray(selector)) {
			dom = removeNullArray(selector);
		}
		else if (type.isObject(selector)) {
			//返回数组
			dom = [selector];
			selector = null;
		}
		else {
			dom = [];
		}

		return jackey8.decorateDom(dom, selector);
	};

	//查找selector是否存在于element元素中
	jackey8.matches = function (element, selector) {
		if (!selector || !element || element.nodeType !== 1) {
			return false;
		}

		//matchesSelector(element,selector)
		//检测该选择器selector是否匹配该元素element的属性
		var matcherSelector = element.webkitMatchesSelector ||
			element.mosMatchesSelector ||
			element.oMatchesSelector ||
			element.matchesSelector;

		if (matcherSelector) {
			return matcherSelector.call(element, selector);
		}

		var match, parent = element.parentNode, temp = !parent;

		//如果没有parentNode
		if (temp) {
			parent = document.createElement('div');
			parent.appendChild(element);
		}

		//~-1 = 0
		match = ~jackey8.queryDom(parent, selector).indexOf(element);

		if (temp) {
			parent.removeChild(element);
		}

		return !!match;

	};

	J8 = function (selector, context) {
		return jackey8.init(selector, context);
	};

	J8.map = function (elements, callback) {
		var value, values = [], i, key;
		if (type.isArray(elements)) {
			for (i = 0; i < elements.length; i++) {
				value = callback(elements[i], i);
				if (value !== null) {
					values.push(value);
				}
			}
		}
		else {
			for (key in elements) {//jshint ignore:line
				value = callback(elements[key], key);
				if (value) {
					values.push(value);
				}
			}
		}

		return values;
	};

	//parent 是否是node的父亲节点
	//document.documentElement.contains(node)
	J8.contains = document.documentElement.contains ?
		function (parent, node) {
			return parent !== node && parent.contains(node);
		} :
		function (parent, node) {
			while (node && (node = node.parentNode)) {
				if (node === parent) {
					return true;
				}
				return false;
			}
		};

	/**
	 * each
	 * 遍历数组或者对象
	 * @param elements
	 * @param callback
	 * @returns {*}
	 */
	J8.each = function (elements, callback) {
		var i, key;
		if (type.isArray(elements)) {
			for (i = 0; i < elements.length; i++) {
				if (callback.call(elements[i], i, elements[i]) === false) {
					return elements;
				}
			}
		}
		else {
			for (key in elements) {
				if (callback.call(elements[key], key, elements[key]) === false) {
					return elements;
				}
			}
		}
		return elements;
	};

	J8.fn = {
		forEach: emptyArray.forEach,
		reduce: emptyArray.reduce,
		push: emptyArray.push,
		sort: emptyArray.sort,
		indexOf: emptyArray.indexOf,
		concat: emptyArray.concat,
		ready: function (callback) {
			//dom载入判断
			//readyRE = /complete|loaded|interactive/,
			//for IE chrome
			if (readyRE.test(document.readyState) && document.body) {
				callback(J8);
			}
			else {
				//for firefox
				//IE5678 not working
				document.addEventListener('DOMContentLoaded', function () {
					callback(J8);
				}, false);
				return this;
			}
		},
		get: function (index) {
			if (!type.isNumber(index)) {
				return slice.call(this);
			}

			return index >= 0 ? this[index] : this[index + this.length];
		},
		toArray: function () {
			return slice.call(this);
		},
		size: function () {
			return this.length;
		},
		remove: function () {
			//通过parentNode.removeChildren
			return this.each(function () {
				if (this.parentNode !== null) {
					this.parentNode.removeChild(this);
				}
			});
		},
		filter: function (selector) {
			if (type.isFunction(selector)) {
				return this.not(this.not(selector));
			}
			//选取返回的html collection中匹配selector的元素
			return J8(emptyArray.filter.call(this, function (element) {
				return jackey8.matches(element, selector);
			}));
		},
		each: function (callback) {
			emptyArray.every.call(this, function (element, index) {
				return callback.call(element, index, element) !== false;
			});
			return this;
		},
		slice: function () {
			//J8() 转为J8实例
			return J8(slice.apply(this, arguments));
		},
		eq: function (index) {
			return index === -1 ? this.slice(index) : this.slice(index, +index + 1);
		},
		first: function () {
			var element = this[0];
			return element && type.isObject(element) ? element : J8(element);
		},
		last: function () {
			var element = this[this.length - 1];
			return element && type.isObject(element) ? element : J8(element);
		},
		is: function (selector) {
			if (this.length > 0 && jackey8.matches(this[0], selector)) {
				return true;
			}
			return false;
		},
		has: function (selector) {
			//s是否具有selector
			return this.filter(function () {
				return type.isObject(selector) ?
					J8.contains(this, selector) :
					J8(this).find(selector).size();
			});
		},
		not: function (selector) {
			//查找不是selector的集合 ｜｜ 去掉selector的元素
			var nodes = [];
			if (type.isFunction(selector)) {
				this.each(function (index) {
					//如果函数执行后不是返回false，则push进去
					if (!selector.call(this, index)) {
						nodes.push(this);
					}
				});
			}
			else {
				var excludes;
				//如果是单纯的string，则检查当前返回的html collection里面是否匹配selector
				if (typeof selector === 'string') {
					excludes = this.filter(selector);
				}
				else {
					//如果是数组，而且item为函数，则直接赋值，其它则实例化
					if (type.isArray(selector) && type.isFunction(selector.item)) {
						excludes = slice.call(selector);
					}
					else {
						J8(selector);
					}
					this.forEach(function (element) {
						if (excludes.indexOf(element)) {
							nodes.push(element);
						}
					});
				}
				//array
				return J8(nodes);
			}
		},
		find: function (selector) {
			//查找selector(子元素)，返回一个组合的结果
			var result, J8this = this;
			if (!selector) {
				//如果selector为空，返回一个空的J8实例
				result = J8();
			}
			else if (typeof selector === 'object') {
				// 如果是对象
				//todo: object
				return J8(selector).filter(function () {
					var node = this;
					return emptyArray.some.call(J8this, function (parent) {
						return J8.contains(parent, node);
					});
				});
			}
			else if (this.length === 1) {
				//如果只有一个元素，利用queryDom(context,selector), 返回改元素的实例
				result = J8(jackey8.queryDom(this[0], selector));
			}
			else {
				//多个数组，则遍历
				result = this.map(function () {
					return jackey8.queryDom(this, selector);
				});
			}

			return result;
		},
		parent: function (selector) {
			//取得父亲节点
			var parentNodes = getProperty(this, 'parentNode');
			//去重
			parentNodes = unique(parentNodes);
			return J8(parentNodes).filter(selector);
		},
		parents: function (selector) {
			var result = [], nodes = this;
			//深度遍历
			while (nodes.length > 0) {
				nodes = J8.map(nodes, function (node) {
					//选取父亲节点，检查是否是document
					node = node.parentNode;
					if (type.isDocument(node) && result.indexOf(node) === -1) {
						result.push(node);
						return node;
					}
				});//jshint ignore:line
			}

			return J8(result).filter(selector);
		},
		children: function (selector) {
			//getChildren 选取子节点，
			var children = J8.map(this, function (element) {
				return getChildren(element);
			});

			//返回children的实例并filter selector
			return J8(children).filter(selector);
		},
		contents: function () {
			//遍历element组合
			return J8.map(this, function (element) {
				//转换为数组返回childNodes
				return slice.call(element.childNodes);
			});
		},
		siblings: function (selector) {
			//parentNode下得所有不等于自己得子节点
			var result = J8.map(this, function (element) {
				return emptyArray.filter.call(getChildren(element.parentNode), function (child) {
					return child !== element;
				});
			});
			return J8(result).filter(selector);
		},
		closest: function (selector, context) {
			//查找最近得selector元素
			var node = this[0], collection = false;

			//selector如果是对象，则直接
			if (typeof selector === 'object') {
				collection = J8(selector);
			}

			//如果找不到，则往parent节点找，直到匹配jackey8.matches(node, selector)
			while (node && !(collection ? collection.indexOf(node) >= 0 : jackey8.matches(node, selector))) {
				node = node !== context && !type.isDocument(node) && node.parentNode;
			}

			return J8(node);
		},
		empty: function () {
			return this.each(function () {
				this.innerHTML = '';
			});
		},
		show: function () {
			return this.each(function () {
				this.style.display === 'none' && (this.style.display = '');
				if (getComputedStyle(this, '').getPropertyValue('display') === 'node') {
					this.style.display = defaultDisplay(this.nodeName);
				}
			});
		}
	};

	['after', 'prepend', 'before', 'append'].forEach(function (operator, index) {
		var inside = index % 2;//0 after before ; 1 prepend append

		J8.fn[operator] = function () {
			//arguments 可能为节点（object） 节点数组(array),J8的对象 或者html字符串
			var nodes = J8.map(arguments, function (arg) {
					if (type.isObject(arg) || type.isArray(arg) || arg === null) {
						return arg;
					}
					else {
						//html string
						return jackey8.createNodeByHtmlFragment(arg);
					}
				}),
				parent,
				copyByClone = this.length > 1;

			if (nodes.length < 1) {
				return this;
			}

			return this.each(function (index, element) {
				//0 after before(get parentNode) ; 1 prepend append(self)
				parent = inside ? element : element.parentNode;

				//0 after:element.nextSibling
				//1 prepend:element.firstChild
				//2 before: self
				//3 append: null
				element = index === 0 ? element.nextSibling :
					index === 1 ? element.firstChild :
						index === 2 ? element : null;

				var parentInDocument = J8.contains(document.documentElement, parent);

				nodes.forEach(function (node) {
					if (copyByClone) {
						node = node.cloneNode(true);
					}
					else if (!parent) {
						return J8(node).remove();
					}
					//全靠insertBefore
					parent.insertBefore(node, element);

					//遍历查看是否有script节点，如果有则执行里面的代码
					if (parentInDocument) {
						traverseNode(node, function (element) {
							if (element.nodeName !== null &&
								element.nodeName.toUpperCase() === 'SCRIPT' &&
								(!element.type || element.type === 'text/javascript') && !element.src) {
								window['eval'].call(window, element.innerHTML);
							}
						});
					}

				});
			});
		};

		// after    => insertAfter
		// prepend  => prependTo
		// before   => insertBefore
		// append   => appendTo
		J8.fn[inside ? operator + 'To' : 'insert' + (index ? 'Before' : 'After')] = function (html) {
			J8(html)[operator](this);
			return this;
		}
	});

	//node 和下面的节点全都执行fun(node)的方法
	function traverseNode(node, fun) {
		fun(node);
		for (var i = 0, len = node.childNodes.length; i < len; i++)
			traverseNode(node.childNodes[i], fun)
	}

	function defaultDisplay(nodeName) {
		var element, display;
		//如果没有记录
		if (!elementDisplay[nodeName]) {
			//根据nodeName去创建一个该元素
			element = document.createElement(nodeName);
			document.body.appendChild(element);
			//获取display的值
			display = getComputedStyle(element, '').getPropertyValue('display');
			element.parentNode.removeChild(element);
			//如果是none，则赋值为block
			display === 'none' && (display = 'block');
			//记录该元素的display值
			elementDisplay[nodeName] = display;
		}
		return elementDisplay[nodeName];
	}

	//选取元素的属性
	function getProperty(elements, property) {
		return J8.map(elements, function (element) {
			return element[property];
		});
	}

	//去重
	function unique(arr) {
		return emptyArray.filter.call(arr, function (item, index) {
			return arr.indexOf(item) === index;
		});
	}

	//选取元素的子节点
	//如果具有children属性则使用，没有则使用childNodes
	function getChildren(element) {
		return 'children' in element ?
			slice.call(element.children) :
			J8.map(element.childNodes, function (node) {
				if (node.nodeType === 1) {
					return node;
				}
			});
	}

	return J8;

})(type);

window.Jackey8 = Jackey8;

if (window.J8 === void 0) {
	window.J8 = Jackey8;
}
