(function (utils, undef){
	'use strict';

	var _slice	= [].slice;
	

	function Context(data, chain, parent){
		this.data	= data;
		this.isObj	= (this.type = typeof data) === 'object' && data !== null;

		if( chain !== undef ) this.chain = chain;
		if( parent !== undef ) this.parent = parent;
	}

	Context.prototype = {

		_chain: function (data){
			if( this.chain !== undef ){
				this.data	= data;
				this.isObj	= (this.type = typeof data) === 'object' && data !== null;
				return	this;
			} else {
				return	new Context(data, true);
			}
		},


		get: function (key){
			if( this.isObj ){
				if( this.data[key] !== undef ){
					return	this._chain(this.data[key]);
				}
			}

			if( this.parent !== undef ){
				return	this.parent.get(key);
			}

			return	Context.Undef;
		},


		mod: function (method){
			if( this.data !== null || this.data !== undef ){
				if( this.data[method] ){
					return	this._chain(this.data[method].apply(this.data, _slice.call(arguments, 1)));
				}
			}

			return	Context.Undef;
		},


		set: function (key, val){
			this.data[key]	= val;
			return	this;
		},


		each: function (input, val, key, fn, ctx){
			if( ctx === undef ){
				ctx = fn;
				fn	= key;
				key = undef;
			}

			utils.each(input, function (v, k){
				this.data[val] = v;
				if( key !== undef ) this.data[key] = k;
				fn( this );
			}, ctx.sub({}));
		},
		

		val: function (){
			if( this.type === 'string' )
				return	utils.htmlEncode(this.data);
			else
				return	this.data;
		},


		sub: function (data){
			return	new Context(data, undef, this);
		},


		getVal: function (args){
			var i = 1, n = args.length, data = this.data, key = args[0];

			if( data[key] !== undef ){
				data = data[key];
				for( ; i < n; i++ ){
					key = args[i];
					if( data[key] !== undef ){
						data = data[key];
					} else {
						return	'';
					}
				}
			} else if( this.parent !== undef ) {
				return	this.parent.getVal(args);
			}

			return	utils.htmlEncode(data);
		}

	};

	
	// Undef context
	Context.Undef = new Context(undef);


	// @export
	module.exports = Context;
})(require('./utils'));
