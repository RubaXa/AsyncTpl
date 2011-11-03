(function (utils, Context){
	'use strict';

	function Reader(ondata, onend){
		if( this instanceof Reader ){
			this._ondata	= ondata;
			this._onend		= onend;
			this._chunks	= [];
		} else {
			return	new Reader(ondata, onend);
		}
	}

	Reader.prototype = {
		constructor: Reader,

	// @private
		_read: function (){
			console.log('chunks:', this._chunks.length);

			while( this._chunks.length ){
				//var data	= [];
				var chunk	= this._chunks[0];

				chunk();

				this._ondata( this._buf.join('') );
				this._chunks.shift();
				this._buf.splice(0);
			}

			if( !this._chunks.length )
				this._onend();
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
			this._buf	= [];
			//this._ctx	= new Context(Tpl.get());
			this._ctx	= Tpl.get();
			Tpl.getFn().call(this, this._ctx, this._buf);
			this._read();
		}
	};

	// @export
	module.exports = Reader;
})(require('./utils'), require('./Context'));
