(function (utils){
	'use strict';

	function args(a){
		return	[a[1], a[2], a[3], a[4], a[5]];
	}

	function Context(data, depth, parent){
		this.depth	= depth || 0;
		this.parent	= parent || null;
		this._check(data, data !== null && typeof data);
	}

	Context.prototype = {

		_chain: function (data){
			if( this.depth === 0 ){
				return	new Context(data, this.depth + 1);
			} else {
				this._check(data, data !== null && typeof data);
				return	this;
			}
		},


		_check: function (data, type){
			this.data	= data;
			this.type	= type;
			this.isObj	= (type === 'object' || type === 'array' || type === 'function');
			this.isSub	= (this.parent !== null);
			this.isNull	= (this.data === null);
		},


		has: function (name){
			return	this.isObj && (name in this.data);
		},


		get: function (name){
			if( this.has(name) ){
				return	this._chain(this.data[name]);
			} else if( this.isSub ){
				return	this.parent.get(name);
			}

			return	Context.Null;
		},


		set: function (key, val){
			if( this.isObj ){
				this.data[key]	= val;
			}
			return	this;
		},


		call: function (name){
			if( !this.isNull ){
				var func = this.data[name];
				if( utils.isFunction(func) ){
					return	this._chain(func.apply(this.data, args(arguments)));
				}
				else if( (this.depth === 0) && this.isSub ){
					return	this.parent.call(name);
				}
			}
			return	Context.Null;
		},


		mod: function (name){
			if( !this.isNull ){
				var func = this.data[name];
				if( utils.isFunction(func) ){
					return	this._chain(func.apply(this.data, args(arguments)));
				}
			}
			return	Context.Null;
		},


		each: function (input, val, key, fn, ctx){
			if( typeof ctx === 'undefined' ){
				ctx = fn;
				fn	= key;
				key = null;
			}

			utils.each(input, function (v, k){
				this.data[val] = v;
				if( key !== null ) this.data[key] = k;
				fn( this );
			}, ctx.sub({}));
		},
		

		val: function (){
			if( this.isNull ){
				return	'';
			} else if( this.type === 'string' ){
				return	utils.htmlEncode(this.data);
			} else {
				return	this.data;
			}
		},

		sub: function (data){
			return	new Context(data, 0, this);
		},

		make: function (data){
			return	new Context(data);
		},

		getVal: function (args){
			var i = 1, n = args.length, data = this.data, key = args[0];

			if( key in data ){
				data = data[key];
				for( ; i < n; i++ ){
					key = args[i];
					if( key in data ){
						data = data[key];
					} else {
						return	'';
					}
				}
			} else if( this.isSub ) {
				return	this.parent.getVal(args);
			}

			return	utils.htmlEncode(data);
		}

	};

	
	// Null context
	Context.Null = new Context(null);


	// @export
	module.exports = Context;
})(require('./utils'));
