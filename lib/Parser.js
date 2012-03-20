/*global require, __export*/

(function (Node, utils, undef){
	'use strict';

	var
		  _rqa          = /['"]/
		, _rspace       = /^[\s\r\n\t]+$/
		, _rnode        = /^([$a-z][\da-z\s:>]|\/\w)$/i
		, _rnodeName    = /[a-z\d:-]/i
	;



	function Parser(opts, file){
		this._file  = file;
		this._opts  = utils.extend({
			  tags:		false
			, left:		'<'
			, right:	'>'
			, c_open:	'<!--'
			, c_close:	'-->'
			, trim:		true
			, firstLine: true
		}, opts);

		if( this._opts.tags ){
			this._opts.tags	= ' '+this._opts.tags+' ';
		}
	}

	Parser.prototype = {
		constructor:	Parser,

		/**
		 * @public
		 * @param {String} input
		 * @return {Array}
		 */
		parse: function (input){
			var
				  ch
				, lex = ''
				, _lex
				, res = []
				, node
				, _close
				, opts = this._opts
				, tags = opts.tags
				, left = opts.left
				, right = opts.right
				, c_open = opts.c_open
				, c_close = opts.c_close
				, len = left.length
				, _line = 0
			;


			if( !opts.firstLine && /^\s*<\?xml/.test(input) ){
				input	= utils.trim(input.replace(/^[^>]+>\n?/, ''));
				_line   = 1;
			}

			input	= new Input(input);

			_parse_:
			while( ch = input.peek() ){
				if( input.match(c_open) ){
					// comment
					_lex = input.extract(c_close, input.lastMatchLength);
					if( _lex !== null ) res.push(Node(Node.COMMENT_NODE, _lex));
				} else if( input.match('<![CDATA[') ){
					// cdata
					_lex = input.extract(']]>', input.lastMatchLength);
					if( _lex !== null ) res.push(Node(Node.CDATA_NODE, _lex));
				} else if( input.match(left) ){
					// open tag
					if( _rnode.test(input.peek(len) + input.peek(len+1)) ){
						_close = input.next(left).peek() == '/' ? (input.next(),true) : false;
						node = _node(input, tags, right);

						if( opts.trim && _rspace.test(lex) ){
							lex	= '';
						} else if( lex != '' ) {
							res.push(Node(Node.TEXT_NODE, lex));
						}

						lex = '';
						if( node.type ==  Node.TEXT_NODE ){
							res.push(node);
						} else {
							node.__open		= !_close;
							node.__close	= node.__close || _close;
							node.__empty	= node.__open && node.__close;
							res.push(node);
						}
					} else {
						lex += ch;
						input.next();
						continue _parse_;
					}
				} else {
					lex += ch;
					input.next();
				}

				if( input.length() == 0 && lex != '' ){
					res.push(node = Node(Node.TEXT_NODE, lex));
				}

				if( res.length ){
					node    = res[res.length-1];
					if( !node.__line ){
						node.__line = input.line() + _line;
						node.__file = this._file;
					}
				}
			}

			res.add = function (item, idx){
				if( idx === undef ) this.push(item);
				else if( idx == 0 ) this.unshift(item);
				else this.splice(idx, 0, item);
				return	this;
			};

			return	res;
		},

		build: function (input){
			var
				  res = []
				, lex
				, node
				, left = this.left
				, right = this.right
			;

			while( node = input.shift() ){
				switch( node.type ){
					case Node.TEXT_NODE:
					case Node.CDATA_NODE:
							lex = node.value;
						break;

					case Node.ELEMENT_NODE:
							lex = left + (!node.__empty && node.__close ? '/' : '') + node.name;
							utils.each(node.attributes, function (attr){
								lex += ' '+ attr.name + (attr.value !== undef ? '="'+attr.value+'"' : '');
							});
							lex += (node.__empty ? ' /' : '') + right;
						break;

					case Node.CUSTOM_NODE:
							lex = left + (node.__close ? '/' : '') + node.name + node.value + right;
						break;
				}

				if( lex != '' ){
					res.push(lex);
					lex = '';
				}
			}

			return	res.join('');
		},

		rebuild: function (input){
			return	this.build(this.parse(input));
		}
	};


	function _node(input, tags, right){
		var name = _nodeName(input), ch, close = false, end = false, attrs = {}, attr = '', val;

		if( !input.length() ){
			return	Node(Node.TEXT_NODE, name);
		}

		input.save('attrs');
		var _attrs = !tags || tags.indexOf(' '+name+' ') > -1;

		_attr_:
		while( ch = input.peek() ){
			if( _attrs && _rnodeName.test(ch) ){
				attr = '';
				while( ch = input.peek() ){
					if( input.match(right) || _rspace.test(ch) ){
						attrs[attr] = Node(attr, Node.ATTRIBUTE_NODE);
						continue _attr_;
					} else if( ch == '=' ){
						if( _rqa.test(input.peek(1)) ){
							val = input.next().getStr();
						} else {
							val = '';
							while( ch = input.next().peek() ){
								if( _rspace.test(ch) || input.match(right) ){
									break;
								} else {
									val	+= ch;
								}
							}
							val = val == '' ? undef : val;
						}

						attrs[attr] = Node(attr, Node.ATTRIBUTE_NODE, val);
						continue _attr_;
					} else {
						attr += ch;
						input.next();
					}
				}
			} else if( input.match(right) ){
				end = true;
				close = input.peek(-1) == '/';
				input.next(right);
				break;
			} else {
				if( !_attrs )
					attr += ch;
				input.next();
			}
		}

		if( !end ){
			input.load('attrs');
			return	Node(Node.TEXT_NODE, name);
		}


		var node = _attrs ? Node(name, Node.ELEMENT_NODE, '', attrs) : Node(name, Node.ELEMENT_NODE, '', attr);
		node.__close = close;
		return	node;
	}


	function _nodeName(input){
		var ch, name = '';
		while( ch = input.peek() ){
			if( _rnodeName.test(ch) ){
				name += ch;
				input.next();
			} else {
				break;
			}
		}
		return	name;
	}

	function Input(str){
		var
			  input = (str + '').split('')
			, index = 0
			, label = {}
		;

		this.pos    = function (){
			for( var i = index; i--; ) if( input[i] == '\n' ) break;
			return index - i + 1;
		};

		this.line   = function (){
			var line = 1;
			for( var i = index; i--; ) if( input[i] == '\n' ) line++;
			return  line;
		};

		this.peek   = function (offset){ return input[index+(offset||0)]; };
		this.lex    = function (len){ return input.slice(index, index + len).join(''); };
		this.match  = function (str){
			var res = this.lex(str.length) === str;
			this.lastMatch	= res ? str : null;
			this.lastMatchLength = res ? str.length : 0;
			return res;
		};


		this.next = function (offset){
			if( typeof offset === 'string' ) offset = offset.length;
			index += (offset||1);
			return this;
		};

		this.save = function (name){ label[name] = index; return this; };
		this.load = function (name){ index = label[name]; return this; };
		this.length = function (){ return input.length - index; };

		this.getStr = function (){
			var ch, str = '', x = this.peek(), slash = 1;
			while( ch = this.peek() ){
				this.next();
				str += ch;

				if( ch == '\\' ){
					slash++;
				} else {
					if( x == ch && !(slash % 2) ){
						return	str.substring(1, str.length-1);
					}
					slash = 0;
				}
			}
		};

		this.substr = function (offset, length){ return input.slice(offset, length || index).join(''); };

		this.extract = function (close, offset){
			this.save('extract');
			if( offset !== undef ) this.next(offset);

			var res = '', ch;
			while( ch = this.peek() ){
				if( this.match(close) ){
					this.next(close);
					return	res;
				} else {
					res	+= ch;
					this.next();
				}
			}

			this.load('extract');
			return	null;
		};
	}



	// @export
	if( typeof __export !== 'undefined' )
		__export('./Parser', Parser);
	else
		module.exports = Parser;
})(require('./Node'), require('./utils'));
