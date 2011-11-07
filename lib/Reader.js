(function (utils, Context){
	'use strict';

	function Reader(ondata, onend){
		if( this instanceof Reader ){
			this._ondata	= ondata;
			this._onend		= onend;
			this._chunks	= [];
			this._length	= 0;
		} else {
			return	new Reader(ondata, onend);
		}
	}

	Reader.prototype = {
		constructor: Reader,

	// @private
		_read: function (){
			console.log('chunks:', this._chunks.length);

			while( true ){
				var chunk	= this._chunks[0];

				chunk();

				this._ondata( this.__buf.join('') );

				if( this._chunks.length === 1 ){
					this._onend();
					break;
				} else {
//					this._length = this.__buf.length;
					this.__buf.splice(0);
					this._chunks.shift();
				}
			}
		},


	// @public
		chunk: function (func, first){
			this._chunks[first ? 'unshift' : 'push'](func);
		},

		each: function (ctx, input, val, key, fn){
			if( typeof fn == 'undefined' ){
				fn	= key;
				key = null;
			}

			utils.each(input, function (_val, _key, data){
				data = {};
				data[val] = _val;
				if( key !== null ) data[key] = _key;
				fn.call(this, ctx.sub(data));
			}, this);
		},

		read: function (Tpl){
			this.__buf	= [];
//			this.__ctx	= Tpl.get();
			this.__ctx	= new Context(Tpl.get());
			Tpl.getFn().call(this, this.__ctx, this.__buf, utils);
			this._read();
		}
	};

	// @export
	module.exports = Reader;
})(require('./utils'), require('./Context'));
