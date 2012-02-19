/*!
 * AsyncTpl — Asynchronous Templating engine for NodeJS/Browser
 *
 * Copyright (c) 2011, Lebedev Konstantin
 * Released under the MIT License.
 */

'use strict';

(function (window, undef){
	var __rmname = /^.+\//, __modules = {};

	function __build(name, Module){ __modules[name.replace(__rmname, '')] = Module; }
	function require(name){ return __modules[name.replace(__rmname, '')]; }

	__build('fs', {
		readFile: function (filename, encoding, fn){ jQuery.ajax({ url: filename, type: 'get', dataType: 'text', isLocal: true, success: function (txt){ fn(null, txt); } }); },
		readFileSync: function (filename){ return jQuery.ajax({ url: filename, type: 'get', async: false, dataType: 'text', isLocal: true }).responseText; },
		lstatSync: function(){ return  { mtime: 0 }; }
	});


	/*global __build*/

(function (){
	var
		  _rns = /(\w+):(\w+)/

		, TYPE = {
			  ELEMENT_NODE: 1
			, ATTRIBUTE_NODE: 2
			, TEXT_NODE: 3
			, CDATA_NODE: 4
			, COMMENT_NODE: 8
			, CUSTOM_NODE: 20
			, COMPILER_NODE: 21
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
		this.attributes	= attrs || [];
		this.childNodes	= [];
	}

	
	Node.prototype = {
		constructor: Node,

		attr: function (name, txt){
			if( this.attributes[name] ){
				return  this.attributes[name].value;
			} else {
				throw   new Error('At line '+this.__line+': tag "'+ this.name +'", attribute "' + (txt || name) + '" is missing');
			}
		},

		replace: function (node){
			this.name	= node.name;
			this.type	= node.type;
			this.value	= node.value;
			this.attributes	= node.attributes;
			return	this;
		},

		addTextNode: function (value){
			return	this.addChild(Node.TEXT_NODE, value);
		},

		addChild: function (node, type, val, attrs){
			if( !(node instanceof Node) ){
				node	= Node(node, type, val, attrs);
			}
			this.childNodes.push(node);
			return	this;
		},

		addChilds: function (list){
			this.childNodes.push.apply(this.childNodes, list); 
			return	this;
		},

		hasChildNodes: function (){
			return	!!this.childNodes.length;
		},

		isShort: function (){
			return  _short[this.name] === true;
		}
	};


	for( var k in TYPE ){
		Node[k] = Node.prototype[k] = TYPE[k];
	}


	// @export
	if( typeof __build !== 'undefined' )
		__build('./Node', Node);
	else
		module.exports = Node;
})();
/*global require, __build*/

(function (fs, undef){
	'use strict';

	var
		  _toStr	= Object.prototype.toString
		, _ptrim	= String.prototype.trim
		, _rid		= /^#/
		, _slice	= [].slice
		, _ltrim	= /^\s+/
		, _rtrim	= /\s+$/
		, _rhtml	= /[&<>"]/g
		, _roquote	= /'/g
		, _rspecial	= { '&': '&amp;', '<': '&lt;',  '>': '&gt;', '"': '&quot;' }
		, _console  = (typeof console !== 'undefined' && console)
	;

	function _replaceTag(a){
		return _rspecial[a];
	}

	var utils = {

		$: function (id){
			if( typeof id == 'string' ){
				return	document.getElementById(id.replace(_rid, ''));
			} else {
				return	id;
			}
		},

		sizeof: function (val){
			var len = 0;
			if( val && (utils.isArray(val) || typeof val == 'object') ){
				if( 'length' in val ) len = val.length;
				else utils.each(val, function (){ len++; });
			}
			return	len;
		},

		isArray: function (val){
			return	_toStr.call(val) == '[object Array]';
		},

		uniqId: function (){
			return	(new Date).getTime()+''+Math.round(Math.random()*1000);
		},

		escape: function (str){
			if( typeof str === "string" ){
				if( _rhtml.test(str) ){
					return	str.replace(_rhtml, _replaceTag);
				}
			}
			return	str;
		},

		addslashes: function (str){
			return	str.replace(_roquote, '\\\'');
		},

		log: _console && (typeof _console.log == 'object')
			?  Function.prototype.call.bind(_console.log, _console)
			: function (){ if( _console ) _console.log.apply(_console, arguments); }
		,

		error: function (err, line, file){
			this.log((line ? 'Error in '+file+'\nAt line '+line+': ' : '')+err.toString());
		},

		// Get object keys
		keys: function(obj){
			var keys = [];

			if( Object.keys ){
				keys = Object.keys(obj);
			} else {
				utils.each(obj, function (key){ keys.push(key); });
			}

			return	keys;
		},

		// Foreach object
		each: function(obj, fn, context){
			if( obj ){
				if( obj.forEach ){
					obj.forEach(fn, context);
				} else if( ('length' in obj) && (0 in obj) ){
					for( var i = 0, n = obj.length; i < n; i++ ) if( i in obj ){
						fn.call(context, obj[i], i, obj);
					}
				} else {
					for( var i in obj ) if( obj.hasOwnProperty(i) ){
						fn.call(context, obj[i], i, obj);
					}
				}
			}
		},

		cycle: function (a, b, fn){
			for( var i = a; i <= b; i++ ){
				fn(i);
			}
		},

		// Trimming string
		trim: _ptrim
				? function (str){ return _ptrim.call(str); }
				: function (str){ return String(str).replace(_ltrim, '').replace(_rtrim, ''); }
			,

		// Extend
		extend: function (dst){
			dst = dst || {};

			this.each(arguments, function (src, i){
				if( i > 0 ) this.each(src, function (val, key){
					dst[key] = val;
				});
			}, this);

			return	dst;
		},

		indexOf: function (array, val){
			if( array.indexOf ){
				return	array.indexOf(val);
			} else {
				for( var i = 0, n = array.length; i < n; i++ ) if( array[i] === val ){
					return	i;
				}
				return	-1;
			}
		},

		inherit: function (To, From, method, args){
			if( arguments.length === 2 ){
				var F = function (){};

				F.prototype			= From.prototype;
				To.prototype		= new F();
				To.prototype.self	= To;
				To.prototype.constructor = To;

				utils.each(From, function (val, key){ To[key] = val; });
			} else {
				return	From.prototype[method].apply(To, args);
			}
		},

		defer: Defer,

		load: function (filename, async, encoding, fn){
			var df = this.defer();
			if( async ){
				fs.readFile(filename, encoding || 'utf-8', function (err, buffer){ df[err ? 'reject' : 'resolve'](err || buffer); });
			} else {
				df.resolve(require('fs').readFileSync(filename, encoding || 'utf-8'));
			}
			return	df.done(fn).promise();
		},

		mtime: function (filename){
			/** @namespace  fs.lstatSync */
			return	fs ? +Date.parse(fs.lstatSync(filename).mtime) : 0;
		},

		writeFile: function (filename, data, encoding){
			if( fs ) fs.writeFileSync(filename, data, encoding);
		},

		getJSON: function (filename, encoding, fn){
			var df = utils.defer();

			if( fs ){
				try {
					df.resolve(JSON.parse(fs.readFileSync(filename, encoding)));
				} catch (er){
					df.reject();
				}
			} else {
				
			}

			return	df.fail(function (){ fn(true); }).done(function (json){ fn(false, json); }).promise();
		}
	};



	function Defer(fn){
		if( !(this instanceof Defer) ){
			return	new Defer(fn);
		}

		var
			  _done = []
			, _fail = []
			, _promise
			, _result
			, _ok	= true
			, _err	= true
			, _end	= false
		;

		this.done	= function (fn){ if( _ok && fn !== undef ){ _end ? fn(_result) : _done.push(fn); } return this; }.bind(this);
		this.fail	= function (fn){ if( _err && fn !== undef ){ _end ? fn(_result) : _fail.push(fn); } return this; }.bind(this);
		this.then	= function (done, fail){ return this.done(done).fail(fail); }.bind(this);

		this.reject	= function (res){
			_ok		= false;
			_end	= true;
			_result	= res;
			while( _fail.length ) _fail.shift()(res);
			return	this
		}.bind(this);

		this.resolve = function (res){
			_err	= false;
			_end	= true;
			_result	= res;
			while( _done.length ) _done.shift()(res);
			return	this;
		}.bind(this);

		this.promise = function (){
			if( _promise === undef ){
				_promise = {
					  done:		this.done
					, fail:		this.fail
					, then:		this.then
					, promise:	this.promise
				};
			}
			return	_promise;
		}.bind(this);

		if( fn !== undef ) fn(this);
	}
	Defer.prototype = { constructor: Defer };
	Defer.when = function (a){
		var df = Defer(), args = [];

		if( a instanceof Defer ){
			args.push.apply(args, arguments);
		} else {
			args = a;
		}

		var i = 0, n = args.length, fn = function (){ if( ++i == n ) df.resolve(); };
		utils.each(args, function (X){ X.done(fn); });
		if( !n ) df.resolve();

		return	df.promise();
	};


	if( Function.prototype.bind === undef ) Function.prototype.bind = function (context) {
		var args = _slice.call(arguments, 1), self = this;
		return function (){ return self.apply(context, args.concat(_slice.call(arguments, 0))); };
	};


	// @export
	if( typeof __build !== 'undefined' )
		__build('./utils', utils);
	else
		module.exports = utils;
})(require('fs'));
/*global require, __build*/

(function (Node, utils, undef){
	'use strict';

	var
		  _rqa          = /['"]/
		, _rlf          = /\n/g
		, _rspace       = /^[\s\r\n\t]+$/
		, _rnode        = /^([$a-z][\da-z\s:>]|\/\w)$/i
		, _rnodeName    = /[a-z\d:]/i
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
				input	= utils.trim(input.replace(/^[^\n]+\n/, ''));
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
					if( !node.__line && (!node.__close || node.__empty) ){
						node.__line = input.line() + _line;
						node.__file = this._file;
					}
				}
			}

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
						attrs[attr] = { name: attr, value: undef };
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
	if( typeof __build !== 'undefined' )
		__build('./Parser', Parser);
	else
		module.exports = Parser;	
})(require('./Node'), require('./utils'));
/*global require, __build*/

(function (utils, undef){
	'use strict';

	function Compiler(opts){
		this._opts	= opts || { useWith: false }; 
	}

	Compiler.prototype = {
		constructor: Compiler,

		compile: function (input){
			var source = ['',''], chunk = [], val, node;

			while( node = input.shift() ){
				if( node.__break ){
					_flush();
					source.push( node.value );
				} else if( node.name == 'value' ){
					if( node.__escape ){
						_flush();
						source.push(' try{__buf.v('+node.value+')}catch(e){} ');
					} else {
						chunk.push( [node.value] );
					}
				} else if( typeof node == 'string' || node.type == node.TEXT_NODE || node.type == node.CDATA_NODE ){
					chunk.push(node.value || node);
				} else {
					_flush();
					source.push( node.value );
				}
			}
			_flush();

			
			if( this._opts.useWith ){
				source[0]	= "with( ctx ){ ";
				source.push(' } ');
			} else {
				source[0]	= "'use strict';/*global __buf*/";
			}

			source[1]   = 'var undef;if(ctx.__part!==undef)__buf.off();';
			source      = source.join('') + ' __buf.end();';

//			require('fs').writeFileSync('out.js', source);
//			console.log( source );
//			console.log('------------------');
			
			return	new Function('ctx, __buf, __utils', source);

			function _flush(){
				var str = '', i = 0, n = chunk.length, prev, type;
				if( n ){
					for( ; i < n; i++ ){
						type = typeof chunk[i];

						if( prev != type || type != 'string' ){
							if( prev ){
								str += prev == 'string' ? "'," : ",";
							}
							str += type == 'string' ? "'" : '';
						}

						str += type == 'string' ? utils.addslashes(chunk[i]) : chunk[i][0];
						prev = type;
					}
					if( type == 'string' ) str += "'";
					source.push('__buf.w('+str.replace(/\r/g, '').replace(/\n/g, '\\n')+');');
					chunk	= [];
				}
			}
		}

	};

	// @export
	if( typeof __build !== 'undefined' )
		__build('./Compiler', Compiler);
	else
		module.exports = Compiler;
})(require('./utils'));
/*global require, __build*/

(function (utils, undef){
	'use strict';

	function Buffer(fn, stream){
		this._data		= '';
		this._pullLen	= 0;
		this._active    = true;

		this._stream	= stream;
		this._callback	= fn;
	}

	Buffer.prototype = {
		constructor: Buffer,

		on: function (){
			this._active    = true;
		},

		off: function (){
			this._active    = false;
		},

		v: function (val){
			if( this._active ) if( val !== undef ){
				this._data += utils.escape(val);
			}
			return	this;
		},

		w: function (s){
			if( this._active ){
				if( arguments.length > 1 ){
			        var tmp = '', l = arguments.length, i = 0;
			        switch( l ){
			            case 9: tmp = arguments[8] + tmp;
			            case 8: tmp = arguments[7] + tmp;
			            case 7: tmp = arguments[6] + tmp;
			            case 6: tmp = arguments[5] + tmp;
			            case 5: tmp = arguments[4] + tmp;
			            case 4: tmp = arguments[3] + tmp;
			            case 3: tmp = arguments[2] + tmp;
			            case 2: {
			                this._data  += arguments[0] + arguments[1] + tmp;
			                break;
			            }
			            default: {
				            l = arguments.length;
			                while( i < l ){
			                    this._data += arguments[i++];
			                }
			            }
			        }
			    } else {
			        this._data  += s;
			    }
			}
		    return this;
		},

		cycle: function (){
			if( this._active ) utils.cycle.apply(utils, arguments);
		},

		each: function (){
			if( this._active ) utils.each.apply(utils, arguments);
		},

		block: function (name, attrs, fn){
			this.w(this.getBlock(name, attrs, fn));
		},

		blockLabel: function (name, attrs, fn){
			if( this._active ){
				if( fn !== undef ) this.setBlock(name, fn, true);

				if( this._blocks === undef ){
					this._chunks	= [];
					this._blocks	= [];
					this._attrs	    = [];
				}

				var idx = this._chunks.push(this._data, name) - 1;
				this._blocks.push(idx);

				if( attrs !== undef ){
					this._attrs[idx]  = attrs;
				}

				this._data = '';
			}
		},

		setBlock: function (name, fn, soft){
			if( this._block === undef ) this._block = {};
			if( soft !== true || this._block[name] === undef )
				this._block[name]	= fn;
		},

		getBlock: function (name, attrs, fn){
			if( this._block[name] !== undef ){
				fn = this._block[name];
			}

			if( fn !== undef ) {
				var _buf = new Buffer();
				_buf._block = this._block;

				fn(_buf, attrs);
				return	_buf.toStr();
			} else {
				return	'';
			}
		},


		pullSync: function (ctx, name, next){
			this.pull(ctx, name, next);
		},
		

		pull: function (ctx, name, fn){
			if( this._pull === undef ) this._pull = {};

			if( this._pull[name] === undef ){
				var df = utils.defer(), _end = (function (){ this._pullLen--; setTimeout(this.end.bind(this), 0); }).bind(this);

				this._pullLen++;
				this._pull[name] = df.then(_end, _end);

				try { ctx[name](function (err, data){ df[err ? 'reject' : 'resolve'](err || data); }); } catch (er){ df.reject(true); }
			}

			if( fn !== undef ){
				this._pull[name].then(function (data){ fn(null, data); }, function (err){ fn(err); })
			}

			return	this._pull[name].promise();
		},


		end: function (){
			if( this._stream ){
				this._callback(this._data);
				this._data = '';
			}

			if( this._pullLen === 0 ){
				if( this._blocks !== undef ){
					var
						  blocks = this._blocks
						, chunks = this._chunks
						, attrs  = this._attrs
						, n = chunks.length
						, i = blocks.length
						, idx
						, res
					;

					for( ; i--; ){
						idx	= blocks[i];
						chunks[idx] = this.getBlock(chunks[idx], attrs[idx]);
					}

					res = chunks[--n];
					for( i = n; i--; ) res = chunks[i] + res;

					this._data	= res + this._data;
				}

				this._callback(this._data);

				if( this._stream ){
					this._callback(null);
				}
			}
		},

		isActive: function (){
			return	this._pullLen !== 0;
		},

		toStr: function (){
			return this._data;
		}

	};



	// @export
	if( typeof __build !== 'undefined' )
		__build('./Buffer', Buffer);
	else
		module.exports = Buffer;
})(require('./utils'));
/*global require, __build, __utils*/

(function (utils, Parser, Compiler, Buffer, undef){
	'use strict';

	var
		  _files = {}
		, _tags = {}
		, _doctype = {
			  def: '<!DOCTYPE html>'
			, strict: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
			, loose: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'
			, xstrict: '<!DOCTYPE html PUBLIC  "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
			, transitional: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
			, xhtml: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
		}
	;


	function Template(filename, opts){
		this.__lego(filename, opts);
	}

	Template.fn =
	Template.prototype = {
		self: Template,
		constructor: Template,

		__lego: function (filename, opts){
			if( typeof filename != 'string' ){
				opts = filename;
				filename = undef;
			}

			this._opts		= this._defaults(opts || {});

			this._data		= {};
			this._files		= {};
			this._listeners	= {};

			this._string	= undef;
			this._filename	= filename;
		},


		/**
		 *
		 * @param {Object}opts
		 */
		_defaults: function (opts){
			return utils.extend({
				  ns:			this.self.NS
				, left:			this.self.LEFT
				, right:		this.self.RIGHT
				, trim:			this.self.TRIM
				, c_open:		this.self.C_OPEN
				, c_close:		this.self.C_CLOSE
				, rootDir:		this.self.ROOT_DIR
				, compileDir:	this.self.COMPILE_DIR
				, async:		this.self.ASYNC
				, stream:		this.self.STREAM
				, escape:		this.self.ESCAPE
				, safeMode:		this.self.SAFE_MODE
				, encoding:		this.self.ENCODING
				, blockMode:    this.self.BLOCK_MODE
				, debug:        this.self.DEBUG
			}, opts);
		},

		_uniqKey: function (x){
			var o = this._opts;
			return	o.left + o.right + o.trim + o.stream + x;
		},
 		
		_compile: function (filename, fn){
			var key = filename === undef ? Math.random() : this._uniqKey(filename);

			if( _files[key] !== undef ){
				_files[key].done(function (tpl){ this._tpl = tpl; }.bind(this));
			}
			else if( !this._tpl && (filename === undef || _files[key] === undef) ){
				var
					  df	= utils.defer()
					, incs	= {}
				;

				_files[key]	= df.promise();

				this._load(filename, function (tpl){
					if( tpl ){
						this._tpl = tpl;
						df.resolve(this._tpl);
					} else {
						if( !this._compiler ){
							this._compiler	= new Compiler(this._opts);
						}

						this._parse(this._opts.rootDir + filename, incs, function (input){
							this._tpl = this._compiler.compile(input);
							this._save(filename, incs);
							df.resolve(this._tpl);
						}.bind(this), incs);
					}
				}.bind(this));
			}

			_files[key].done(fn);
		},
		

		_parse: function (filename, incs, fn){
			if( this._parser === undef ){
				this._parser = new Parser(this._opts, filename);
			}

			var
				  o = this._opts
				, df = utils.defer()
				, inc = []
				, stack = []
				, loaded = function (input){
					var
						  inc	= []
						, node
						, path	= filename.replace(/\/[\s%|\w\._-]+$/, '/')
						, res
					;

					input = this._parser.parse(input);

					try {
						while( node = input.shift() ){
							this._prepare(node, input, stack);

							node.prev   = this.__node;
							res         = this._trans(node, input, stack);
							this.__node = node;

							if( res !== null && node.type != node.COMMENT_NODE ){
								stack.push(res);
							}

							if( node.name == 'include' ){
								inc.push(this._parse(path + node.value, incs).done(function (idx, entry){
									stack[idx-1] = entry;
								}.bind(this, stack.length)));
							}
						}
					} catch( err ){
						inc     = [];
						stack   = [node.__file+'\n'+err.message];
					}

					this.__node = undef;

					utils.defer.when(inc).done(function (){ df.resolve(this._normalizeStack(stack)); }.bind(this));
				}.bind(this)
			;

			if( this._string !== undef ){
				loaded(this._string || '[[undefined]]');
			} else {
				if( !incs[filename] ){
					incs[filename] = utils.mtime(filename);
				}

				this.self.load(filename, o.async, o.encoding, loaded);
			}

			return	df.done(fn).promise();
		},

		_normalizeStack: function (stack){
			var res = [], entry;

			while( entry = stack.shift() ){
				if( typeof entry != 'string' && entry[0] ){
					stack	= entry.concat(stack);
					continue;
				}
				res.push(entry);
			}

			return	res;
		},

		_save: function (filename, incs){
			if( this._opts.compileDir ){
				utils.writeFile(
					  this._opts.compileDir + filename + '.json'
					, JSON.stringify({ includes: incs, template: this._tpl.toString() })
					, this._opts.encoding
				);
			}
		},

		_load: function (filename, fn){
			var opts = this._opts, ok = true, df = utils.defer();

			if( opts.compileDir ){
				utils.getJSON(opts.compileDir + filename + '.json', opts.encoding, function (err, json){
					if( err ){
						df.resolve(false);
					} else {
						utils.each(json.includes, function (mtime, filename){
							if( utils.mtime(filename) != mtime )
								ok	= false;
						});

						df.resolve(ok && (new Function('return '+json.template))());
					}
				});
			} else {
				df.resolve(false);
			}

			return	df.done(fn).promise();
		},

		_try: function (val, info, ret){
			if( !info ){
				if( val && val.__line  ){
					info    = val;
					val     = val.value;
				} else {
					info    = {};
				}
			}
			return    'try{'+ val +'}catch(_){'
					+ (this._opts.debug ? '__utils.error(_,'+info.__line+',"'+info.__file+'");' : '')
					+ (ret !== undef ? 'return '+ret : '')
					+ '}';
		},

		_prepare: function (node, input, stack){
			var next    = input[0] && input[0].name;
			if( next == 'attrs' || next == 'attributes' ){
				node.__openTag  = true;
			}
		},

		_trans: function (node, input, stack){
			var res = [], val, attrs = node.attributes;

			if( this._opts.ns == node.ns || !node.ns ) switch( node.name ){
				case 'script':
						val	= ' '+this._try(input.shift())+' ';
						input.shift();
					break;

				case 'if': val = node.__close ? '}' : 'if('+this.safe(node.value, node)+'){'; break;
				case 'else': val = '}'+ node.name +'{'; break;
				case 'elseif':
				case 'else if': val = '}else if('+ this.safe(node.value, node) +'){'; break;

				case 'for':
				case 'cycle':
				case 'foreach':
						node.__break = true;
						if( node.__close ){
							node.value	= '});';
						} else {
							var args	= '';
							if( attrs['to'] ){
								val	= '__buf.cycle('
									+ node.attr('from')
									+ ', '+node.attr('to')
									+', function ('
									+ (attrs.key || attrs.item || {value:''}).value
									+ '){';
							} else {
								if( attrs.item ) args  = attrs.item.value;
								if( attrs.key )  args += (args == '' ? '__v,' : ',') + attrs.key.value;
								val	= '__buf.each('+this.safe(node.attr('from', attrs._from), node)+', function ('+args+'){';
							}
						}
					break;

				case 'pull':
						if( !node.__close ){
							var pull = { id: utils.uniqId(), name: node.attr('name'), as: attrs.as && node.attr('value') || node.attr('name'),  async: !!attrs.async, error: attrs.error && node.attr('error') || 'err' };
							if( !this._pullStack ) this._pullStack = [];
							this._pullStack.push(pull);

							val = '__buf.w(\'<span id="'+pull.id+'">\');';

							if( attrs.async ){
								val += '__buf.pull(ctx,"'+ pull.name +'");';
							} else {
								val += '__buf.pullSync(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){';
								input.push({ value: '});', type: node.ELEMENT_NODE });
							}
						} else {
							val	= '__buf.w(\'</span>\');';
						}
					break;

				case 'assign':
						val = ' ctx[\''+utils.addslashes(node.attr('value'))+'\']=';
						if( attrs.type && attrs.type != 'string' ){
							val += node.attr('value');
						} else {
							val += "'"+utils.addslashes(node.attr('value'))+"';"
						}
					break;

				case 'get':
						var _attrs = [], key, _attr;

						if( attrs.attrs ){
							_attr   = attrs.attrs.value;
						} else for( key in attrs ) if( key != 'name' && key != 'attrs-name' ){
							_attrs.push(this._try('a.'+key+'='+node.attr(key), node));
						}

						if( node.__empty ){
							val = '__buf.#method#("'+node.attr('name')+'",#attrs#);';
						}
						else if( node.__close ){
							val = '});';
						} else {
							if( this._opts.blockMode == 1 ){
								val = '__buf.#method#("'+node.attr('name')+'",#attrs#,function (__buf,'+(attrs['attrs-name'] && attrs['attrs-name'].value || 'attrs')+'){'
							} else {
								val     = '__buf.#method#("'+node.attr('name')+'",#attrs#)';
								_attr   = input.shift().value;
								input.shift();
							}
						}

						if( _attr ){
							if( _attrs.length ) console.log('WARNING: Can\'t use block attributes at block mode == 2');
							_attrs  = this.safe(_attr, node);
						}
						else {
							_attrs  = _attrs.length ? '(function(a){'+ _attrs.join('') +' return a})({})' : 'undef';
						}

						val = val.replace('#attrs#', _attrs).replace('#method#', this._opts.stream || this.blockLevel ? 'block' : 'blockLabel');
					break;

				case 'set':
						if( input[0].name == 'set' && input[0].__close ){
							input.shift();
							return	null;
						}

						this.blockLevel	= (this.blockLevel|0) + (node.__close ? -1 : 1);

						if( node.__close ){
							val = '});'
						} else {
							val = '';
							if( attrs.test ) val += 'if('+this.safe(node.attr('test'), node)+')';
							val += '__buf.setBlock("'+node.attr('name')+'",function(__buf,'+(attrs['attrs-name'] && node.attr('attrs-name') || 'attrs')+'){';
						}
					break;

				case 'fail':
				case 'loading':
				case 'success':
						var pull = this._pullStack[this._pullStack.length-1];

						if( node.name == 'loading' ){
							return	null;
						} else {
							val	= node.__close ? '}' : 'if(' + (node.name == 'fail' ? '' : '!') +pull.error+ '){';
							if( pull.async ){
								if( node.__close ){
									val += '__buf.w(\'</span><script>(function(a,b){try{a.parentNode.insertBefore(b,a);b.style.display="";a.parentNode.removeChild(a);}catch(er){}})(__utils.$("#%id"),__utils.$("#%name%id"));</script>'.replace(/%id/g, pull.id).replace('%name', node.name)+'\'); });'
								} else {
									val = '__buf.pull(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){'
										+ '__buf.w(\'<span id="'+node.name+pull.id+'" style="display: none">\');'
										+ val;
								}
							}
						}
					break;

				case 'part':
						if( node.__close ){
							val = 'if(ctx.__part=="'+ this.__parts.pop() +'")__buf.off();';
						}
						else {
							val = 'if(ctx.__part=="'+node.attr('name')+'")__buf.on();';
							if( !this.__parts ) this.__parts = [];
							this.__parts.push(node.attr('name'));
						}
					break;

				case 'space':
						node.type = node.TEXT_NODE;
						val = ' ';
					break;

				case 'text':
						node.type	= node.TEXT_NODE;
						if( attrs.value ){
							val = node.attr('value');
						} else {
							val	= input.shift().value;
							input.shift();
						}
					break;

				case 'attrs':
				case 'attributes':
						if( node.__close ){
							val = '';
							node.type = node.TEXT_NODE;
							if( input[0].__close && !input[0].__empty && input[0].isShort() ){
								input.shift();
								val += '/';
							}
							val += this._opts.right;
						}
						else {
							if( !node.prev || node.prev.type != node.ELEMENT_NODE || node.prev.__close ){
								throw   new Error('At line '+node.__line+': <'+this._opts.ns+':'+node.name+'/> must be the first child');
							}
							return null;
						}
					break;

				case 'attr':
				case 'attribute':
						node.type = node.TEXT_NODE;
						val = node.__close ? '"' : ' '+node.attr('name')+'="';
					break;

				case 'closure':
						if( node.__close ){
							val = '})('+this.__closure.shift().join(',')+');';
						} else {
							var _attrs = [], key, _vars = [];
							val = '(function(';
							this.__closure = this.__closure || [];
							for( key in attrs ){
								_vars.push(key);
								_attrs.push(this.safe(node.attr(key), node));
							}
							val += _vars.join(',')+'){';
							this.__closure.push(_attrs);
						}
					break;

				default:
						val = this._myNode(node.name, node, attrs);
						if( val !== undef ){
							node.type = node.TEXT_NODE;
							if( utils.isArray(val) ){
								res = val;
								val = undef;
							}
						}
					break;
			}

			if( val !== undef ){
				node.value	= val;
			}

			return	res.length ? res : node;
		},


		_myNode: function (name, node, attrs){
			if( _tags[name] ){
				return	_tags[name].call(this, node, attrs)
			} else if( _tags['_'] ){
				return	_tags._.call(this, node, attrs);
			}
		},



	// @public
		fetch: function (ctx, fn){
			if( fn === undef ){
				fn  = ctx;
				ctx = undef;
			}

			if( this._tpl === undef ){
				this._compile(this._filename, this.fetch.bind(this, ctx, fn));
			}
			else {
				this._tpl(ctx || {}, new Buffer(fn, this._opts.stream), utils);
			}
		},


		loadString: function (str){
			this._string = utils.trim(str);
			this._compile();
			return	this;
		},

		
		on: function (event, fn){
			this._listeners[event] = fn;
			return	this;
		},
		

		set: function (data, val){
			if( typeof data == 'string' ){
				this._data[data] = val;
			} else {
//				this._data	= utils.extend(this._data, data);
				this._data = data || {};
			}
			return	this;
		},

		safe: function (expr, node, noExec){
			if( !node || !node.__line ){
				noExec  = node;
				node    = undef;
			}
			return	this._opts.safeMode
						? '(function(){'+this._try('return '+expr, node, '""')+'})'+(noExec ? '' : '()')
						: expr;
		},

		escape: function (expr, node){
			return	this._opts.escape ? '__utils.escape('+this.safe(expr, node)+')' : this.safe(expr, node);
		}
		
	};


	// @private
	Template._files	= {};
	Template.load	= function (filename, async, encoding, fn){
		return	(this._files[filename] || (this._files[filename] = utils.load(filename, async, encoding))).done(fn);
	};


	// @const
	Template.NS				= 'xtpl';
	Template.LEFT			= '<';
	Template.RIGHT			= '>';
	Template.C_OPEN			= '<!--';
	Template.C_CLOSE		= '-->';
	Template.TRIM			= true;
	Template.ASYNC			= true;
	Template.STREAM			= false;
	Template.ESCAPE			= true;
	Template.SAFE_MODE		= true;
	Template.ENCODING		= 'utf-8';
	Template.BLOCK_MODE		= 1;
	Template.DEBUG	    	= true;
	Template.ROOT_DIR		= '';
	Template.COMPILE_DIR	= '';



	// @static public
	Template.fetch = function (filename, ctx, fn){
		var tpl = new this(filename), df = utils.defer(), _res = '';
		tpl.fetch(ctx, function (chunk){
			if( chunk === null || !tpl._opts.stream ){
				df.resolve(tpl._opts.stream ? _res : chunk);
			} else {
				_res += chunk;
			}
		});
		if( fn ) df.done(fn);
		return	df.promise();
	};


	Template.fromString = function (str, opts){
		return (new this(opts)).loadString(str);
	};


	Template.tags = function (tags){
		utils.each(tags, function (fn, name){
			_tags[name] = fn;
		});
		return	this;
	};

	
	Template.tags({
		'doctype': function (node, attrs){
			return	_doctype[attrs.mode && attrs.mode.value] || _doctype.def;
		}
	});
	
	
	Template.engine	= function (obj){
		if( typeof obj == 'string' ){
			obj	= require('./'+obj);
		}

		var proto = this.fn;
		proto._super = {};

		utils.each(obj.statics, function (method, name){ this[name] = method; }, this);

		utils.each(obj.fn, function (method, name){
			var prev = proto[name];
			if( prev ){
				proto._super[name] = prev;
				proto[name] = method;
			} else {
				proto[name]	= method;
			}
		});

		return	Template;
	};



	// @export
	if( typeof __build !== 'undefined' )
		__build('./AsyncTpl', Template);
	else
		module.exports = Template;
})(require('./utils'), require('./Parser'), require('./Compiler'), require('./Buffer'));
/*global require, __build*/

(function (utils, undef){
	'use strict';

	var XML = {};
	
	XML.fn = {
		_defaults: function (opts){
			return	this._super._defaults.call(this, utils.extend(opts || {}, { firstLine: false }));
		},

		_build: function (node, attrs){
			var res = [];

			if( typeof node == 'string' ){
				node = { name: 'a' };
			}

			if( !node.__empty && node.__close ){
				res.push('</'+ node.name +'>');
			} else {
				res.push('<'+node.name);
				var _rns = new RegExp(this._opts.ns+':');

				utils.each(attrs, function (attr){
					if( _rns.test(attr.value) ){
						res.push(
							  ' '+attr.name+'="'
							, { name: 'value', value: attr.value.replace(_rns, ''), __escape: true }
							, '"'
						);
					} else {
						res.push(' '+attr.name+'="'+attr.value+'"');
					}
				}, this);

				if( !node.__openTag ){
					res.push(node.__empty ? '/>' : '>');
				}
			}

			return	res;
		},


		_trans: function(node, input, stack){
			var res = [], val, attrs = node.attributes;

			if( node.ns != this._opts.ns ){
				if( node.type == node.ELEMENT_NODE ){
					res = this._build(node, attrs);
				}
			} else {
				switch( node.name ){
					case 'if': val = node.__close ? '' : node.attr('test'); break;
					case 'choose': this.__choose = node.__open ? 1 : 0; break;
					case 'when':
							val = node.__close ? '}' : (this.__choose == 1 ? '' : ' else ') + 'if('+ this.safe(node.attr('test'), node) +'){';
							this.__choose++;
						break;

					case 'otherwise': val = node.__close ? '}' : ' else {'; break;

					case 'foreach':
							attrs = { _from: 'iterate', from: attrs.iterate || attrs.from, key: attrs.index, item: attrs.as, 'to': attrs['to'] };
						break;

					case 'value':
							val = this.escape(input.shift().value, node);
							input.shift();
						break;

					case 'include': val = node.attr('src'); break;

					case 'comment':
							node.type = node.TEXT_NODE;
							if( node.__empty ){
								val	= '';
							} else {
								val	= '<!--'+ input.shift().value + '-->';
								input.shift();
							}
						break;

					case 'template': return null; break;
				}
			}


			if( val !== undef ){
				if( utils.isArray(val) ) res = val;
				else node.value = val;
			}

			node.attributes = attrs;

			return	res.length  ? res : this._super._trans.call(this, node, input, stack);
		}
	};


	// @export
	if( typeof __build !== 'undefined' )
		__build('./XML', XML);
	else
		module.exports = XML;
})(require('./utils'));
/*global require, __build*/

(function (utils, undef){
	'use strict';

	var
		  _rr		= /\r/g
		, _rn		= /\n/g
		, _rre		= /^\/(.+)\/(\w*)$/
		, tags		= 'foreach include extends block doctype'
		, Smarty	= {}
	;

	Smarty.fn = {
		_defaults: function (opts){
			opts			= utils.extend({ left: '{{', right: '}}' }, opts, { tags: tags });
			opts.c_open		= opts.left + '*';
			opts.c_close	= '*' + opts.right;
			return this._super._defaults.call(this, opts);
		},

		_trans: function (node, input){
			var res = [], val, attrs = node.attributes;

			if( node.type == node.ELEMENT_NODE || node.type == node.CUSTOM_NODE ) switch( node.name ){
				case 'if':
				case 'else':
				case 'elseif': val = attrs; break;

				case 'script':
				case 'cycle': break;

				case 'foreach':
						node.__break = true;
						if( !this.__foreach ){
							this.__foreach = [];
							this.__foreachelse = [];
						}
						if( node.__open ){
							this.__foreach.push(attrs.from.value);
						} else if( this.__foreachelse.length ){
							this.__foreachelse = [];
							node.value	= '}';
							return node;
						}
					break;

				case 'foreachelse':
						var name = this.__foreach.pop();
						this.__foreachelse.push(name);
						val = '}); if(!__utils.sizeof('+this.safe(name, node)+')){';
					break;

				case 'block':
						var name = node.attr('name');

						if( !this.__blocks ){
							this.__blocks = {};
							this.___blocks = [];
						}

						if( name ){
							this.___blocks.push(name);
							this.__blocks[name] = 1 + this.__blocks[name]||0;
						} else {
							name = this.___blocks.shift();
						}

						node.name = this.__blocks[name] > 0 ? 'set': 'get';
					break;

				case 'extends':
				case 'include':
						node.name = 'include';
						val = attrs.file.value;
					break;

				default:
						if( this.fns[node.name] ){
							var xattr = [];
							utils.each(attrs, function (a, k, v){
								v = a.value;
								if( /$\$/.test(v) ) v = this.safe(v, node); else v = '"'+v+'"';
								xattr.push(k +':'+ v);
							});
							node.value = '__this.fns.'+node.name+'({'+xattr.join(',')+'},ctx)';
							node.name = 'value';
							return	node;
						} else {
							val	= this.escape(node.name + attrs, node);
							node.name = 'value';
						}
					break;
			}

			if( val !== undef ){
				node.value = val;
			}

			return	res.length  ? res : this._super._trans.call(this, node, input);
		},

		escape: function (expr){
			var mods = expr.split('|');
			expr = this._super.escape.call(this, this.safe(mods[0]));
			utils.each(mods.splice(1), function (mod){
				mod = mod.split(':');
				expr = '__this.mods.'+ mod[0] +'('+ expr + (mod.length>1 ? ','+mod.splice(1).join(',') : '') +')';
			});
			return	expr;
		},

		safe: function (expr){
			return this._super.safe.call(this, expr.replace(/\$([a-z][a-z0-9_]*)/ig, function (a, b){
				return '(typeof '+b+'==="undefined"?ctx.'+b+':'+b+')';
			}));
		}

	};


	Smarty.statics = {
		fn: function (funcs){
			utils.each(funcs, function (fn, name){
				tags += ' '+name;
				this.fns[name] = fn;
			}, this);
			return	this;
		},

		modifiers: function (mods){
			utils.each(mods, function (mod, name){
				this.mods[name] = function (){
					return	mod.apply(this, arguments);
				};
			}, this);
			return	this;
		}
	};

	
	Smarty.fn.fns = Smarty.statics.fns = {};
	Smarty.fn.mods = Smarty.statics.mods = {};


	Smarty.statics
		.fn({
			assign: function (attrs, ctx){
				ctx[attrs['var']] = attrs['value'];
				return '';
			}
		})
		.modifiers({
			  'upper': function (str){ return str.toUpperCase(); }
			, 'lower': function (str){ return str.toLowerCase(); }
			, 'capitalize': function (str){ return str.charAt(0).toUpperCase()+str.substr(1).toLowerCase(); }
			, 'nl2br': function (str){ return str.replace(_rr, '').replace(_rn, '<br/>'); }
			, 'regexp_replace': function (str, search, replace){
				search = search.match(_rre);
				return str.replace(new RegExp(search[1], search[2]), replace);
			}
		})
	;


	// @export
	if( typeof __build !== 'undefined' )
		__build('./Smarty', Smarty);
	else
		module.exports = Smarty;
})(require('./utils'));

	

	// GLOBALIZE
	window.AsyncTpl = require('AsyncTpl');

	var
		  _tpl	= {}
		, utils	= require('utils')
	;

	AsyncTpl.fetch = function (tplId, targetId, data, fn){
		if( typeof targetId != 'string' ){
			fn = data;
			data = targetId;
			targetId = undef;
		}

		if( _tpl[tplId] === undef ){
			if( tplId.charAt(0) == '#' ){
				var node	= utils.$(tplId) || { innerHTML: '[[#'+tplId+' — not found]]' };
				_tpl[tplId]	= new this;
				_tpl[tplId].loadString(node.innerHTML);
			} else {
				_tpl[tplId]	= new this(tplId);
			}
		}


		var df = utils.defer(), s = '';

		_tpl[tplId].fetch(data, function (r){
			df.resolve(r === undef ? s : r);
		});

		if( targetId ) df.done(function (html){
			var node = utils.$(targetId);
			if( node ) node.innerHTML = html;
		});

		return	df.promise().done(fn);
	};


	if( typeof jQuery != 'undefined' ){
		/**
		 * @public
		 * @return	AsyncTpl
		 */
		jQuery.tpl = function (engine){
			AsyncTpl.engine(engine);
			jQuery.tpl = function (){ return this; };
			return	this;
		};
		jQuery.fn.tpl = function (tplId, data){
			jQuery.tpl('XML').fetch(tplId, this[0], data);
			return	this;
		};
	}
})(this);
