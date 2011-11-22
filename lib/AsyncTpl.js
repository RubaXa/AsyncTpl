(function (utils, Parser, Compiler, undef){
	'use strict';

	var _files = {}, uid = (new Date).getTime() + Math.round(Math.random() * 10000);

	function Template(filename, opts){
		this.__lego(filename, opts);
	}

	Template.prototype = {
		self: Template,
		constructor: Template,

		__lego: function (filename, opts){
			this._opts		= this._defaults(opts || {});

			this._data		= {};
			this._files		= {};
			this._listeners	= {};
			this._filename	= filename;

			this._pullLen	= 0;
			this._pullQueue	= {};

			this.blockLabel	= '[['+uid+']]';
		},


	// @private
		_defaults: function (opts){
			return utils.extend({
				  left:			this.self.LEFT
				, right:		this.self.RIGHT
				, trim:			this.self.TRIM
				, c_open:		this.self.C_OPEN
				, c_close:		this.self.C_CLOSE
				, rootDir:		this.self.ROOT_DIR
				, compileDir:	this.self.COMPILE_DIR
				, async:		this.self.ASYNC
				, stream:		this.self.STREAM
				, escape:		this.self.ESCAPE
				, safeMode:		this.self.SAFEMODE
				, encoding:		this.self.ENCODING
			}, opts);
		},

		_fetch: function (){
			this._compile(this._filename, function (_tpl){
				this.emit('start');

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

				this._blocks	= {};
				this._resultFn	= function (){
									if( _chunk !== '' ) ondata();
									if( _sync ){
										var _str = '', i = _blocks.length-1;
										for( ; i >= 0; i -= 2 ) _result[_blocks[i-1]] = this.getBlock(_blocks[i]);
										for( i = _result.length; i--; ) _str = _result[i] + _str;
										return _str;
									}
								};

				_tpl(this._data, this, ondata.bind(this), utils);

				function ondata(){
					var i = arguments.length-1, str = arguments[i]+'', a = arguments[0];

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

				this._end();
			}.bind(this));

			return	this;
		},

		_uniqKey: function (x){
			var o = this._opts;
			return	o.LEFT + o.RIGHT + o.TRIM + o.stream + x;
		},
 		
		_compile: function (filename, fn){
			var key = this._uniqKey(filename);

			if( _files[key] === undef ){
				var
					  df	= utils.defer()
					, incs	= {}
				;

				this._load(filename, function (tpl){
					if( tpl ){
						df.resolve(tpl);
					} else {
						if( !this._compiler ){
							this._compiler	= new Compiler(this._opts);
						}

						this._parse(this._opts.rootDir + filename, incs, function (input){
							var tpl = this._tpl = this._compiler.compile(input);
							this._save(filename, incs);
							df.resolve(tpl);
						}.bind(this), incs);
					}
				}.bind(this));

				_files[key]	= df;
			}

			return	_files[key].done(fn).promise();
		},
		

		_parse: function (filename, incs, fn){
			if( this._parser === undef ){
				this._parser = new Parser(this._opts);
			}

			var o = this._opts, df = utils.defer(), inc = [], stack = [];

			if( !incs[filename] ){
				incs[filename] = utils.mtime(filename);
			}

			this.self.load(filename, o.async, o.encoding, function (input){
				var
					  inc	= []
					, node
					, path	= filename.replace(/\/[\s%|\w\._-]+$/, '/')
					, res
				;

				input = this._parser.parse(input);

				while( node = input.shift() ){
					res = this._trans(node, input);

					if( res !== null && node.type != node.COMMENT_NODE ){
						stack.push(res);
					}

					if( node.name == 'include' ){
						inc.push(this._parse(path + node.value, incs).done(function (idx, entry){
							stack[idx-1] = entry;
						}.bind(this, stack.length)));
					}
				}

				utils.defer.when(inc).done(function (){ df.resolve(this._normalizeStack(stack)); }.bind(this));
			}.bind(this));

			return	df.done(fn).promise();
		},

		_normalizeStack: function (stack){
			var res = [], entry;

			while( entry = stack.shift() ){
				if( typeof entry != 'string' && entry[0] ){
					stack	= entry.concat(stack);
					continue;
				}
				res.push(entry);
			}

			return	res;
		},

		_save: function (filename, incs){
			if( this._opts.compileDir ){
				utils.writeFile(
					  this._opts.compileDir + filename + '.json'
					, JSON.stringify({ includes: incs, template: this._tpl.toString() })
					, this._opts.encoding
				);
			}
		},

		_load: function (filename, fn){
			var opts = this._opts, ok = true, df = utils.defer();

			if( opts.compileDir ){
				utils.getJSON(opts.compileDir + filename + '.json', opts.encoding, function (err, json){
					if( err ){
						df.resolve(false);
					} else {
						utils.each(json.includes, function (mtime, filename){
							if( utils.mtime(filename) != mtime )
								ok	= false;
						});
						df.resolve(ok && (new Function('return '+json.template))());
					}
				});
			} else {
				df.resolve(false);
			}

			return	df.done(fn).promise();
		},

		_end: function (){
			if( !this._pullLen ){
				this.emit('end', this._resultFn());
			}
		},


	// @public
		clone: function (){
			var tpl = new this.self(this._filename, this._opts);
			utils.each(this._data, function (val, key){ tpl._data[key] = val; });
			utils.each(this._listeners, function (val, key){ tpl._listeners[key] = val; });
			return	tpl;
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

		pullSync: function (ctx, name, next){
			this.pull(ctx, name, next);
		},

		pull: function (ctx, name, fn){
			if( this._pullQueue[name] === undef ){
				var df = utils.defer(), _end = (function (){ this._pullLen--; setTimeout(this._end.bind(this), 0); }).bind(this);

				this._pullLen++;
				this._pullQueue[name] = df.then(_end, _end);

				try { ctx[name](function (err, data){ df[err ? 'reject' : 'resolve'](err || data); }); } catch (er){ df.reject(true); }
			}

			if( fn !== undef ){
				this._pullQueue[name].then(function (data){ fn(null, data); }, function (err){ fn(err); })
			}

			return	this._pullQueue[name].promise();
		},

		fetch: function (){
			return	this.clone()._fetch();
		},

		preload: function (){
			if( this._tpl === undef ){
				this._tpl	= this._compiler.compile(this._filename);
			}
			return	this;
		},

		safe: function (expr){
			return	this._opts.safeMode ? '(function(){try{return '+expr+'}catch(e){return""}})()' : expr;
		},

		escape: function (expr){
			return	this._opts.escape ? '__utils.escape('+this.safe(expr)+')' : expr;
		}
		
	};


	// @private
	Template._files	= {};
	Template.load	= function (filename, async, encoding, fn){
		return	(this._files[filename] || (this._files[filename] = utils.load(filename, async, encoding))).done(fn);
	};


	// @const
	Template.NS				= 'xtpl';
	Template.LEFT			= '<';
	Template.RIGHT			= '>';
	Template.C_OPEN			= '<!--';
	Template.C_CLOSE		= '-->';
	Template.TRIM			= true;
	Template.ASYNC			= true;
	Template.STREAM			= false;
	Template.ESCAPE			= true;
	Template.SAFEMODE		= true;
	Template.ENCODING		= 'utf-8';
	Template.ROOT_DIR		= '';
	Template.COMPILE_DIR	= '';



	// @static public
	Template.fetch = function (filename, data){
		var tpl = new this(filename), df = utils.defer(), _res = '';
		tpl
			.set(data)
			.on('data', function (chunk){ _res += chunk; })
			.on('end', function (res){ df.resolve(res === undef ? _res : res); })
			.fetch()
		;
		return	df.promise();
	};
	
	
	Template.extend	= function (obj){
		if( typeof obj == 'string' ){
			obj	= require('./'+obj);
		}

		var proto = this.prototype;

		utils.each(obj, function (method, name){
			var parent = proto[name];
			if( parent ){
				proto[name] = function (){
					this.parent = function (){ return parent.apply(this, arguments); };
					return	method.apply(this, arguments);
				};
			} else {
				proto[name]	= method;
			}
		});

		return	Template;
	};



	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./Template', Template);
	else
		module.exports = Template;
})(require('./utils'), require('./Parser'), require('./Compiler'));
