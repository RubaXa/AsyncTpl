(function (){
	'use strict';

	var
		  _ptrim	= String.prototype.trim
		, _toStr	= Object.prototype.toString
		, _ltrim	= /^\s+/
		, _rtrim	= /\s+$/
		, _rvar		= /:var/g
		, _roquote	= /'/g
		, _rhtml	= /[&<>\"]/
		, _ramp		= /&/g
		, _rlt		= /</g
		, _rgt		= />/g
		, _rquot	= /\"/g
		, _rspecial	= { '&': '&amp;', '<': '&lt;',  '>': '&gt;', '"': '&quot;' }
	;


	// @public
	var utils =  {

		isFunction: function (val){
			return	_toStr.call(val) == '[object Function]';
		},

		htmlEncode: function (str){
			if( typeof str === "string" ){
//				if( !_rhtml.test(str) ){
//					return	str;
//				}
				return	str.replace(_rhtml, function (a){ return _rspecial[a] });
				return	str.replace(_rhtml, '&amp;').replace(_rlt, '&lt;').replace(_rgt, '&gt;').replace(_rquot, '&quot;');
			}
			return	str;
		},

		addslashes: function (str){
			return	str.replace(_roquote, '\\\'');
		},

		regexp: function (expr, mod){
			return new RegExp(expr.replace(_rvar, '[\\w\\d_.]+'), mod);
		},

		// Get object keys
		keys: function(obj){
			var keys = [];

			if( Object.keys ){
				keys = Object.keys(obj);
			} else {
				_each(obj, function (key){ keys.push(key); });
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
		}
	};


	// @export
	module.exports = utils;
})();
