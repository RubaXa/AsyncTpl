(function (utils, Parser, Compiler, undef){
	'use strict';

	var
		  uid = (new Date).getTime() + Math.round(Math.random() * 10000)
		, _rblock = /%%\d+:([^%]+)%%/g
	;

	function Template(filename, opts){
		this.__lego(filename, opts);
	}

	Template.prototype = {
		self: Template,
		constructor: Template,

		__lego: function (filename, opts){
			this._opts		= utils.extend({
								  left:		this.self.LEFT
								, right:	this.self.RIGHT
								, trim:		this.self.TRIM
								, async:	true
								, stream:	true
								, escape:	true
								, safeMode:	true
							}, opts);

			this._data		= {};
			this._listeners	= {};
			this.blockLabel	= '[['+uid+']]';

			this._filename	= filename;
			this._compiler	= (new Compiler(this._opts))
								.parser(new Parser(this._opts))
								.transformer(this._trans)
							;
		},

	// @public
		emit: function (event, data){
			var list = this._listeners;
			if( list[event] !== undef ){
				list[event](data);
			}
		},

		on: function (event, fn){
			this._listeners[event] = fn;
			return	this;
		},

		set: function (data){
			this._data	= data;
			return	this;
		},

		getBlock: function (name, fn){
			var _str = '';
			if( this._blocks[name] !== undef ){
				fn	= this._blocks[name];
			}
			if( fn !== undef ) fn(function (){
				var i = arguments.length-1, str = arguments[i];
				if( i !== 0 ) for( ; i--; ) str = arguments[i] + str;
				_str += str;
			});
			return	_str;
		},

		setBlock: function (name, fn){
			if( fn !== undef ) this._blocks[name] = fn;
		},

		fetch: function (){
			this.preload().emit('start');

			var
				  _bLabel	= this.blockLabel
				, _idx		= 0
				, _sync		= !this._opts.stream
				, _chunk	= ''
				, _result	= []
				, _blocks	= []
				, _ondata	= this._opts.stream && this._listeners.data || function (chunk){
					if( chunk === undef ){
						_result[_idx++] = _chunk;
						_chunk = '';
					} else {
						_chunk += chunk;
					}
				}
			;

			this._blocks = {};
			this._tpl(this._data, this, ondata.bind(this), utils);

			function ondata(){
				var i = arguments.length-1, str = arguments[i], a = arguments[0];

				if( a === _bLabel ){
					_ondata();
					_ondata();
					_blocks.push(_idx, arguments[1]);
					_ondata();
					this.setBlock(arguments[1], arguments[2]);
				} else if( a === undef ){
					if( _sync ) _ondata();
				} else {
					if( i !== 0 ){
						for( ; i--; ) str = arguments[i] + str;
					}
					_ondata(str);
				}
			}


			if( _sync ){
				var _str = '', i = _blocks.length-1;
				for( ; i >= 0; i -= 2 ){
					_result[_blocks[i-1]]	= this.getBlock(_blocks[i]);
				}
				for( i = _result.length; i--; ){
					_str	= _result[i] + _str;
				}
				this.emit('end', _str);
			} else {
				this.emit('end');
			}

			return	this;
		},

		preload: function (){
			if( this._tpl === undef ){
				this._tpl	= this._compiler.compile(require('fs').readFileSync(this._filename));
			}
			return	this;
		}

	};

	Template.LEFT	= '<';
	Template.RIGHT	= '>';
	Template.TRIM	= true;


	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Template', Template);
	else
		module.exports = Template;
})(require('./utils'), require('./Parser'), require('./Compiler'));
