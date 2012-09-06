/*global require, __export*/

(function (fs, undef){
	'use strict';

	var
		  _toStr	= {}.toString
		, _ptrim	= ''.trim
		, _rid		= /^#/
		, _slice	= [].slice
		, _ltrim	= /^\s+/
		, _rtrim	= /\s+$/
		, _rhtml	= /[&<>"]/g
		, _ramp		= /&/g
		, _rgt		= />/g
		, _rlt		= /</g
		, _rquot	= /"/g
		, _roquote	= /'/g
		, _console  = (typeof console !== 'undefined' && console)
	;


	function S4(){
	   return	(((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}


	var utils = {

		mods: {},

		Array: function (array){
			array = array || [];

			array.map = array.map || function (fn){
				var res = [], i = 0, n = this.length;
				for( ; i < n; i++ ){
					res.push(fn(this[i]));
				}
				return	res;
			};

			array.add = function (item, idx, order){
				item.__order = ~~order;
				if( idx === undef ) this.push(item);
				else if( idx == 0 ) this.unshift(item);
				else this.splice(idx, 0, item);
				return	this;
			};

			array.addOrder = function (item, order){
				return	this.add(item, undef, order);
			};

			array.addMulti = function (elms, idx){
				if( elms.length ) this.splice.apply(this, [idx, 0].concat(elms));
				return	this;
			};

			array.order = function (){
				this.sort(function (a, b){ return a.__order - b.__order; });
				return	this;
			};

			return	array;
		},

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
		   return	(S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		},

		ns: function (ctx, ns, val){
			var ns = ns.split('.'), last = ns.pop();
			utils.each(ns, function (key){
				if( !ctx[key] ) ctx[key] = {};
				ctx = ctx[key];
			});
			ctx[last] = val;
		},

		escape: function (str){
			// http://jsperf.com/htmlescape-vs-goog-string-htmlescape
			if( typeof str === "string" ){
				if( _rhtml.test(str) ){
					if( ~str.indexOf('&') ) str = str.replace(_ramp, '&amp;');
					if( ~str.indexOf('<') ) str = str.replace(_rlt, '&lt;');
					if( ~str.indexOf('>') ) str = str.replace(_rgt, '&gt;');
					if( ~str.indexOf('"') ) str = str.replace(_rquot, '&quot;');
				}
			}
			else if( typeof str === 'undefined' ){
				return '';
			}

			return	str;
		},

		addslashes: function (str){
			return	str.replace(_roquote, '\\\'');
		},

		log: _console && (typeof _console.log == 'object')
			? Function.prototype.call.bind(_console.log, _console)
			: function (){ if( _console ) _console.log.apply(_console, arguments); }
		,

		exception: function (msg, line, file){
			throw { message: msg, line: line, file: file };
		},

		error: function (err, line, file){
			var str = 'Error: '+err.message + ' in '+(err.file || file)+' on line '+(err.line || line);
			if( err.stack ) str += '\n'+ err.stack;
			utils.log(str);
			return  str;
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
				if( 'length' in obj && (0 in obj) ){
					for( var i = 0, n = obj.length, r; i < n; i++ ){
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

			utils.each(arguments, function (src, i){
				if( i > 0 ) utils.each(src, function (val, key){
					dst[key] = val;
				});
			});

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
			var df = utils.defer();
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
		},

		joinObj: function (obj){
			var res = [];
			utils.each(obj, function (val, key){
				if( val ) res.push(key);
			});
			return	res.join(' ');
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
			, self	= this
		;

		self.done	= function (fn){ if( _ok && fn ){ _end ? fn(_result) : _done.push(fn); } return self; };
		self.fail	= function (fn){ if( _err && fn ){ _end ? fn(_result) : _fail.push(fn); } return self; };
		self.then	= function (done, fail){ return self.done(done).fail(fail); };

		self.reject	= function (res){
			_ok		= false;
			_end	= true;
			_result	= res;
			while( _fail.length ) _fail.shift()(res);
			return	self
		};

		self.resolve = function (res){
			_err	= false;
			_end	= true;
			_result	= res;
			while( _done.length ) _done.shift()(res);
			return	self;
		};

		self.promise = function (){
			if( _promise === undef ){
				_promise = {
					  done:		self.done
					, fail:		self.fail
					, then:		self.then
					, promise:	self.promise
				};
			}
			return	_promise;
		};

		if( fn !== undef ) fn(self);
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


	if( Function.prototype.bind === undef ) Function.prototype.bind = function (ctx) {
		var args = _slice.call(arguments, 1), self = this;
		return function (){ return self.apply(ctx, args.concat(_slice.call(arguments, 0))); };
	};


	// @export
	if( typeof __export !== 'undefined' )
		__export('./utils', utils);
	else
		module.exports = utils;
})(require('fs'));


