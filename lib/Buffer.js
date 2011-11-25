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

		s: function (str){
			this._data	+= str;
			return	this;
		},

		v: function (val){
			if( val === undef ) val = '';
			this._data += val;
			return	this;
		},

		write: function (){
			var n = arguments.length, i = 0;
			if( n === 1 ) this._data += arguments[0];
			else for( ; i < n; i++ ){
				this._data += arguments[i];
			}
		},

		block: function (name, fn){
			this.write(this.getBlock(name, fn));
		},

		blockLabel: function (name, fn){
			if( fn !== undef ) this.setBlock(name, fn);
			if( this._blocks === undef ){
				this._chunks	= [];
				this._blocks	= [];
			}
			
			this._chunks.push(this._data, name);
			this._blocks.push(this._chunks.length-1);
			
			this._data = '';
		},

		setBlock: function (name, fn){
			if( this._block === undef ) this._block = {};
			this._block[name]	= fn;
		},

		getBlock: function (name, fn){
			if( this._block[name] !== undef ) fn = this._block[name];
			if( fn !== undef ) {
				var _buf = new Buffer();
				_buf._block = this._block;
				fn(_buf);
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
					var blocks = this._blocks, n = this._chunks.length, i = blocks.length, idx, res = '';

					for( ; i--; ){
						idx	= this._blocks[i];
						this._chunks[idx] = this.getBlock(this._chunks[idx]);
					}

					for( i = 0; i < n; i++ ) res += this._chunks[i];

					this._data	= res + this._data;
				}

				if( !this._stream ){
					this._callback(this._data);
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
