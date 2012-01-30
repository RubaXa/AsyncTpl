(function (utils, undef){
	'use strict';

	function Buffer(fn, stream){
		this._data		= '';
		this._pullLen	= 0;

		this._stream	= stream;
		this._callback	= fn;
	}

	Buffer.prototype = {
		constructor: Buffer,

		v: function (val){
			if( val !== undef ){
				this._data += utils.escape(val);
			}
			return	this;
		},

		w: function (s){
			if( arguments.length > 1 ){
		        var tmp = "", l = arguments.length, i = 0;
		        switch( l ){
		            case 9: tmp = arguments[8] + tmp;
		            case 8: tmp = arguments[7] + tmp;
		            case 7: tmp = arguments[6] + tmp;
		            case 6: tmp = arguments[5] + tmp;
		            case 5: tmp = arguments[4] + tmp;
		            case 4: tmp = arguments[3] + tmp;
		            case 3: tmp = arguments[2] + tmp;
		            case 2: {
		                this._data  += arguments[0] + arguments[1] + tmp;
		                break;
		            }
		            default: {
			            l = arguments.length;
		                while( i < l ){
		                    this._data += arguments[i++];
		                }
		            }
		        }
		    } else {
		        this._data  += s;
		    }
		    return this;
		},

		block: function (name, fn){
			this.write(this.getBlock(name, fn));
		},

		blockLabel: function (name, fn, ctx){
			if( fn !== undef ) this.setBlock(name, fn);

			if( this._blocks === undef ){
				this._chunks	= [];
				this._blocks	= [];
			}

			if( ctx !== undef ){
				if( this._ctx === undef ) this._ctx = {};
				this._ctx[name] = ctx;
			}
			
			this._chunks.push(this._data, name);
			this._blocks.push(this._chunks.length-1);
			
			this._data = '';
		},

		setBlock: function (name, fn){
			if( this._block === undef ) this._block = {};
			this._block[name]	= fn;
		},

		getBlock: function (name, ctx, fn){
			if( fn === undef ){
				fn = ctx;
				ctx = undef;
			}

			if( ctx === undef && this._ctx !== undef ){
				ctx	= this._ctx[name];
			}

			if( this._block[name] !== undef ){
				fn = this._block[name];
			}

			if( fn !== undef ) {
				var _buf = new Buffer();
				_buf._block = this._block;

				if( ctx !== undef ){
					ctx = ctx();
				}

				fn(_buf, ctx);
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
						, n = chunks.length
						, i = blocks.length
						, idx
						, res = ''
					;

					for( ; i--; ){
						idx	= blocks[i];
						chunks[idx] = this.getBlock(chunks[idx]);
					}

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
	if( typeof __build !== 'undefined' )
		__build('./Buffer', Buffer);
	else
		module.exports = Buffer;
})(require('./utils'));
