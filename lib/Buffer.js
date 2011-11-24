(function (utils, undef){
	'use strict';

	function Buffer(tpl){
		this._len		= 0;

		this._data		= [];
		this._chunk		= [];

		this._block		= {};
		this._blocks	= [];

		this._pull		= {};
		this._pullLen	= 0;
	}

	Buffer.prototype = {
		constructor: Buffer,

		write: function (){
			var i = arguments.length-1, str = arguments[i]+'', a = arguments[0];
			if( i !== 0 ){
				for( ; i--; ) str = arguments[i] + str;
			}
			this._chunk	+= str;
		},

		block: function (name, fn){
			this.write(this.getBlock(name, fn));
		},

		blockLabel: function (name, fn){
			this.flush();
			if( fn !== undef ) this._block[name] = fn;
			this._blocks.push(this._len);
			this._data[this._len++] = name;
		},

		setBlock: function (name, fn){
			this._block[name]	= fn;
		},

		getBlock: function (name, fn){
			if( this._block[name] !== undef ) fn = this._block[name];
			if( fn !== undef ) {
				var _buf = new Buffer();
				_buf._block = this._block;
				fn(_buf);
				_buf.flush();
				return	_buf.toStr();
			} else {
				return	'';
			}
		},


		pullSync: function (ctx, name, next){
			this.pull(ctx, name, next);
		},

		pull: function (ctx, name, fn){
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

		flush: function (){
			this._data[this._len++]	= this._chunk;
			this._chunk = '';
		},

		end: function (){
			if( !this.isActive() ){
				this.flush();
				this.done(this.toStr());
			}
		},

		isActive: function (){
			return	this._pullLen !== 0;
		},

		toStr: function (){
			var _str = '', _result = this._data, i, idx;
			if( this._blocks.length ){
				for( i = this._blocks.length; i--; ){
					idx	= this._blocks[i];
					_result[idx] = this.getBlock(_result[idx]);
				}
			}
			for( i = _result.length; i--; ) _str = _result[i] + _str;
			return _str;
		}

	};



	// @export
	if( typeof __build !== 'undefined' )
		__build('./Buffer', Buffer);
	else
		module.exports = Buffer;
})(require('./utils'));
