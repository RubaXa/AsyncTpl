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
