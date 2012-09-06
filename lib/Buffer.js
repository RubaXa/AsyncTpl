/*global require, __export*/

(function (utils, undef){
	'use strict';

	function Buffer(fn, stream){
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
				this._data += utils.escape(val);
			}
		},

		w: function (s){
			if( this._active ){
				this._data	+= s;
			}
		},

		cycle: function (){
			if( this._active ) utils.cycle.apply(utils, arguments);
		},

		each: function(obj, fn){
			if( this._active && obj ){
				if( 'length' in obj && (0 in obj) ){
					for( var i = 0, n = obj.length, r; i < n; i++ ){
						fn(obj[i], i);
					}
				} else {
					for( var i in obj ) if( obj.hasOwnProperty(i) ){
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
				if( fn !== undef ) this.setBlock(name, fn, true);

				if( this._blocks === undef ){
					this._chunks	= [];
					this._blocks	= [];
					this._attrs	    = [];
				}

				var idx = this._chunks.push(this._data, name) - 1;
				this._blocks.push(idx);

				if( attrs !== undef ){
					this._attrs[idx]  = attrs;
				}

				this._data = '';
			}
		},

		setBlock: function (name, fn, soft){
			if( this._block === undef ) this._block = {};
			if( soft !== true || this._block[name] === undef )
				this._block[name]	= fn;
		},

		getBlock: function (name, attrs, fn){
			if( this._block[name] !== undef ){
				fn = this._block[name];
			}

			if( fn !== undef ) {
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
				if( this._blocks !== undef ){
					var
						  blocks = this._blocks
						, chunks = this._chunks
						, attrs  = this._attrs
						, n = chunks.length
						, i = blocks.length
						, idx
						, res
					;

					while( i--){
						idx	= blocks[i];
						chunks[idx] = this.getBlock(chunks[idx], attrs[idx]);
					}

					res = chunks[--n];
					i = n;
					while( i-- ){
						res = chunks[i] + res;
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
