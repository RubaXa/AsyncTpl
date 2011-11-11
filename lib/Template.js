(function (utils, Parser, Compiler, undef){
	'use strict';

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
								, stream:	true
								, safeMode:	true
							}, opts);

			this._data		= {};
			this._listeners	= {};

			this._filename	= filename;
			this._compiler	= (new Compiler(this._opts))
								.parser(new Parser(this._opts))
								.transformer(this._trans)
							;
		},

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

		getBlock: function (name){
			return	this._blocks[name] || '';
		},

		setBlock: function (name, fn){
			var _str = '';
			fn(function (){
				var i = arguments.length-1, str = arguments[i];
				if( i !== 0 ) for( ; i--; ) str = arguments[i] + str;
				_str += str;
			});
			this._blocks[name] = _str;
		},

		fetch: function (){
			this._tpl		= this._tpl || this._compiler.compile(require('fs').readFileSync(this._filename));
			this.emit('start');

			var
				  _result = ''
				, _ondata = this._opts.stream && this._listeners.data || function (chunk){ _result += chunk; }
			;
			
			this._blocks	= {};

			this._tpl(this._data, this, ondata, utils);

			function ondata(){
				var i = arguments.length-1, str = arguments[i];
				if( i !== 0 ) for( ; i--; ) str = arguments[i] + str;
				_ondata(str);
			}

			this.emit('end', _result);

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
