/*global require, __export*/

(function (utils, undef){
	'use strict';

	var __escape = utils.escape;

	function Buffer(fn, stream){
		/**
		 * Если использовать Array, то выигрываем только в опере +3,000 ops/sec
		 */
		this._data		= '';

		this._pullLen	= 0;
		this._active    = true;

		this._stream	= stream;
		this._callback	= fn;
	}

	Buffer.prototype = {
		constructor: Buffer,

		uniqId: function (){
			return	utils.uniqId();
		},

		on: function (){
			this._active    = true;
		},

		off: function (){
			this._active    = false;
		},

		v: function (val){
			if( this._active ){
				this._data += __escape(val);
			}
		},

		w: function (s){
			if( this._active ){
				this._data += s;
			}
		},

		cycle: function (){
			if( this._active ) utils.cycle.apply(utils, arguments);
		},

		each: function(obj, fn){
			if( this._active && obj ){
				var n = obj.length, i = n;
				if( (typeof n !== 'undefined') && (0 in obj) ){
					while( i-- ){
						fn(obj[n-i-1], n-i-1);
					}
				} else {
					for( i in obj ) if( obj.hasOwnProperty(i) ){
						fn(obj[i], i);
					}
				}
			}
		},

		block: function (name, attrs, fn){
			this.w(this.getBlock(name, attrs, fn));
		},

		blockLabel: function (name, attrs, fn){
			if( this._active ){
				if( typeof fn !== 'undefined' ){
					this.setBlock(name, fn, true);
				}

				if( typeof this._blocks === 'undefined' ){
					this._chunks	= [];
					this._blocks	= [];
					this._attrs	    = [];
				}

				var idx = this._chunks.length;

				this._chunks[idx]	= this._data;
				this._blocks[idx]	= name;
				this._attrs[idx]	= attrs;

				this._data = '';
			}
		},

		setBlock: function (name, fn, soft){
			if( this._block === undef ) this._block = {};
			if( soft !== true || this._block[name] === undef )
				this._block[name]	= fn;
		},

		getBlock: function (name, attrs, fn){
			if( typeof this._block[name] !== 'undefined' ){
				fn = this._block[name];
			}

			if( typeof fn !== 'udnefined' ){
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
				if( typeof this._blocks !== 'undefined' ){
					var
						  blocks = this._blocks
						, chunks = this._chunks
						, attrs  = this._attrs
						, i = chunks.length-1
						, res = chunks[i] + this.getBlock(blocks[i], attrs[i])
					;

					while( i-- ){
						res = chunks[i] + this.getBlock(blocks[i], attrs[i]) + res;
					}

					this._data	= res + this._data;
				}

				if( this._callback !== undef ){
					this._callback(this._data);
				}

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
	if( typeof __export !== 'undefined' )
		__export('./Buffer', Buffer);
	else
		module.exports = Buffer;
})(require('./utils'));
