/*global require, __export*/

(function (utils){
	var
		  _rns = /^([^:]+):(.+)/

		, TYPE = {
			  ELEMENT_NODE: 1
			, ATTRIBUTE_NODE: 2
			, TEXT_NODE: 3
			, CDATA_NODE: 4
			, COMMENT_NODE: 8
			, CUSTOM_NODE: 20
			, COMPILER_NODE: 21
			, VAR_NODE: 22
		}

		, _short = { area: true, base: true, br: true, col: true, command: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, wbr: true }
	;

	/**
	 * @constructor
	 */
	function Node(name, type, val, attrs){
		if( !(this instanceof Node) ){
			return	new Node(name, type, val, attrs);
		}

		if( typeof name === 'number' ){
			attrs	= val;
			val		= type;
			type	= name;

			switch( type ){
				case Node.TEXT_NODE: name = '<text>'; break;
				case Node.CDATA_NODE: name = '<cdata>'; break;
				case Node.COMMENT_NODE: name = '<comment>'; break;
				case Node.CUSTOM_NODE: name = '<custom>'; break;
			}

			this.name	= name;
		} else {
			name	= name.toLowerCase();
			if( name.match(_rns) ){
				this.ns	= RegExp.$1;
				name = RegExp.$2;
			}
			this.name	= name;
		}

		this.type		= type;
		this.value		= val;
		this.attributes	= attrs || {};
		this.childNodes	= [];
	}


	Node.prototype = {
		constructor: Node,

		attr: function (name, txt){
			if( this.attributes[name] ){
				return  this.attributes[name].value;
			} else {
				utils.exception('Tag "'+ this.name +'", attribute "' + (txt || name) + '" is missing', this.__line, this.__file);
			}
		},

		attrAny: function (names, required){
			var attr;
			utils.each(names.split(' '), function (name){
				attr = attr || this.attributes[name];
			}, this);
			if( required && !attr ) this.attr(required);
			return	attr && attr.value;
		},

		removeAttr: function (name){
			delete this.attributes[name];
		},

		c: function (ns, name, attrs, closed, val){
			return	this.clone(ns, name, Node.COMPILER_NODE, attrs, closed, val);
		},

		clone: function (ns, node, type, attrs, closed, value){
			node 			= Node(node, this.type, node.value);
			node.ns			= ns;
			node.type		= type;
			node.value		= value;
			node.__line		= this.__line;
			node.__file		= this.__file;
			node.__open		= !closed;
			node.__close	= !!closed;
			utils.each(attrs, function (val, name){
				node.attributes[name] = Node(name, Node.ATTRIBUTE_NODE, val);
			});
			return	node;
		},

		isShort: function (){
			return  _short[this.name] === true;
		}
	};


	for( var k in TYPE ){
		Node[k] = Node.prototype[k] = TYPE[k];
	}


	Node.trace = function (input, opts){
		var pad = '';
		utils.each(input, function (node){
			if( !node.__empty && node.__close ) pad = pad.substr(0, pad.length-3);
			var log = pad + opts.left + (!!node.__close ? '/' : '')
					+ (node.ns ? node.ns + ':' : '') + node.name;

			if( typeof node.attributes == 'string' ){
				log += node.attributes;
			} else {
				utils.each(node.attributes, function (attr, name){
					log	+= ' '+ name +'="'+ attr.value +'"';
				});
			}

			console.log(log + opts.right);
			if( !node.__empty && node.__open ) pad += '   ';
		}, this);
	};


	Node.findClosureIdx = function (stack, node, offset){
		if( !node.__close ) for( var i = offset|0, n = stack.length, c = 0, next; i < n; i++ ){
			next = stack[i];
			if( node.name == next.name ){
				c += next.__close ? -1 : 1;
				if( next.__close && c < 1 ){
					return	i;
				}
			}
		}
	};

	// @export
	if( typeof __export !== 'undefined' )
		__export('./Node', Node);
	else
		module.exports = Node;
})(require('./utils'));
