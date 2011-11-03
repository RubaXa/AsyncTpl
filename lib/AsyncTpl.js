(function (utils, Reader, Compiler){
	'use strict';	

	var def = { left: '{{', right: '}}' };

	function Tpl(filename, opts){
		if( this instanceof Tpl ){
			this._opts  = opts = utils.extend({}, def, opts);
			this._data	= {};
			this._on	= {};


			Compiler(opts.left, opts.right).build(filename, function (source){
//				console.log(source);
				this._tpl = Compiler.compile(source);
				this._loaded = true;
				if( this._fetch )
					this.fetch();
			}.bind(this));
		} else {
			return	new Tpl(filename, opts);
		}
	}
	Tpl.prototype = {
		constructor: Tpl,

	// @private
		
	// @public
		set: function (data){
			for( var key in data ) if( data.hasOwnProperty(key) ){
				this._data[key] = data[key];
			}
			return	this;
		},

		get: function (name){
			return	name ? this._data[name] : this._data;
		},

		on: function (name, fn){
			this._on[name] = fn;
			return	this;
		},

		emit: function (name, data){
			if( name in this._on ){
				this._on[name].call(this, data);
			}
		},

		getFn: function (){
			return	this._tpl;
		},

		fetch: function (){
			this._fetch	= true;
			if( this._loaded ){
				this.emit('start');
				Reader(this.emit.bind(this, 'data'), this.emit.bind(this, 'end')).read(this);
			}
			return	this;
		}
	};


	// @export
	module.exports = Tpl;
})(require('./utils'), require('./Reader'), require('./Compiler'));
