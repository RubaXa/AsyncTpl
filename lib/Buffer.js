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

		on: function (){
			this._active    = true;
		},

		off: function (){
			this._active    = false;
		},

		v: function (val){
			if( this._active ) if( val !== undef ){
				this._data += utils.escape(val);
			}
		},

		w: function (s){
			if( this._active ){
				this._data	+= s;
			}
		},

		write: function (s){
			if( this._active ){
				if( arguments.length > 1 ){
			        var tmp = '', agrs = arguments, l = agrs.length, i = 0;
			        switch( l ){
			            case 9: tmp = agrs[8] + tmp;
			            case 8: tmp = agrs[7] + tmp;
			            case 7: tmp = agrs[6] + tmp;
			            case 6: tmp = agrs[5] + tmp;
			            case 5: tmp = agrs[4] + tmp;
			            case 4: tmp = agrs[3] + tmp;
			            case 3: tmp = agrs[2] + tmp;
			            case 2: {
			                this._data  += agrs[0] + agrs[1] + tmp;
			                break;
			            }
			            default: {
				            l = agrs.length;
			                while( i < l ){
			                    this._data += agrs[i++];
			                }
			            }
			        }
			    } else {
			        this._data  += s;
			    }
			}
		},

		cycle: function (){
			if( this._active ) utils.cycle.apply(utils, arguments);
		},

		each: function (){
			if( this._active ) utils.each.apply(utils, arguments);
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

					for( ; i--; ){
						idx	= blocks[i];
						chunks[idx] = this.getBlock(chunks[idx], attrs[idx]);
					}

					res = chunks[--n];
					for( i = n; i--; ) res = chunks[i] + res;

					this._data	= res + this._data;
				}

				this._callback(this._data);

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
