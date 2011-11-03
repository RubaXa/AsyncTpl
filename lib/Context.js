(function (utils){
	'use strict';

	function args(a){
		return	[a[1], a[2], a[3], a[4], a[5]];
	}

	function Context(data, depth, parent){
		this.data = data;
		this.depth = depth || 0;
		this.parent = parent || null;

		this.isObj = (data !== null && (typeof data === 'object'));
		this.isSub = (this.parent !== null);
		this.isNull = (data === null);
	}

	Context.prototype = {
		_chain: function (data){
			return	new Context(data, this.depth + 1, this.parent);
		},

		has: function (name){
			return	this.isObj && (name in this.data);
		},

		get: function (name){
			if( !this.isNull ){
				if( this.has(name) ){
					return	this._chain(this.data[name]);
				}
				else if( this.isSub ){
					return	this.parent.get(name);
				}
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

		each: function (input, val, key, fn, context){
			if( typeof context == 'undefined' ){
				context = fn;
				fn	= key;
				key = null;
			}

			utils.each(input, function (_val, _key, data){
				data = {};
				data[val] = _val;
				if( key !== null ) data[key] = _key;
				//ctx.get('Subject').val();
				fn( this.sub(data) );
			}, this);
		},

		val: function (){
			return	utils.htmlEncode(this.data);
		},

		sub: function (data){
			return	new Context(data, 0, this);
		},

		make: function (data){
			return	new Context(data);
		}

	};

	
	// Null context
	Context.Null = new Context(null);


	// @export
	module.exports = Context;
})(require('./utils'));
