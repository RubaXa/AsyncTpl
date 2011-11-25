(function (utils, Parser, Compiler, Buffer, undef){
	'use strict';

	var
		  _files = {}
		, _tags = {}
		, _doctype = {
			  def: '<!DOCTYPE html>'
			, strict: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
			, loose: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'
			, xstrict: '<!DOCTYPE html PUBLIC  "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
			, transitional: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
			, xhtml: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
		}
	;


	function Template(filename, opts){
		this.__lego(filename, opts);
	}

	Template.fn =
	Template.prototype = {
		self: Template,
		constructor: Template,

		__lego: function (filename, opts){
			if( typeof filename != 'string' ){
				opts = filename;
				filename = undef;
			}

			this._opts		= this._defaults(opts || {});

			this._data		= {};
			this._files		= {};
			this._listeners	= {};

			this._string	= undef;
			this._filename	= filename;
		},


		/**
		 *
		 * @param {Object}opts
		 */
		_defaults: function (opts){
			return utils.extend({
				  ns:			this.self.NS
				, left:			this.self.LEFT
				, right:		this.self.RIGHT
				, trim:			this.self.TRIM
				, c_open:		this.self.C_OPEN
				, c_close:		this.self.C_CLOSE
				, rootDir:		this.self.ROOT_DIR
				, compileDir:	this.self.COMPILE_DIR
				, async:		this.self.ASYNC
				, stream:		this.self.STREAM
				, escape:		this.self.ESCAPE
				, safeMode:		this.self.SAFE_MODE
				, encoding:		this.self.ENCODING
			}, opts);
		},

		_uniqKey: function (x){
			var o = this._opts;
			return	o.LEFT + o.RIGHT + o.TRIM + o.stream + x;
		},
 		
		_compile: function (filename, fn){
			var key = this._uniqKey(filename);

			if( this._tpl ){
				//fn(this._tpl);
			} else if( filename === undef || _files[key] === undef ){
				var
					  df	= utils.defer()
					, incs	= {}
				;

				_files[key]	= df.promise();
				this._load(filename, function (tpl){
					if( tpl ){
						df.resolve(tpl);
					} else {
						if( !this._compiler ){
							this._compiler	= new Compiler(this._opts);
						}

						this._parse(this._opts.rootDir + filename, incs, function (input){
							this._tpl = this._compiler.compile(input);
							this._save(filename, incs);
							df.resolve();
						}.bind(this), incs);
					}
				}.bind(this));
			}

			_files[key].done(fn);
		},
		

		_parse: function (filename, incs, fn){
			if( this._parser === undef ){
				this._parser = new Parser(this._opts);
			}

			var
				  o = this._opts
				, df = utils.defer()
				, inc = []
				, stack = []
				, loaded = function (input){
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
				}.bind(this)
			;

			if( this._string !== undef ){
				loaded(this._string || '[[undefined]]');
			} else {
				if( !incs[filename] ){
					incs[filename] = utils.mtime(filename);
				}

				this.self.load(filename, o.async, o.encoding, loaded);
			}

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


		_trans: function (node, input){
			var res = [], val, attrs = node.attributes;

			if( this._opts.ns == node.ns || !node.ns ) switch( node.name ){
				case 'script':
						val	= ' try{ '+ input.shift().value +' } catch(e){} ';
						input.shift();
					break;

				case 'if': val = node.__close ? '}' : 'if('+this.safe(node.value)+'){'; break;
				case 'else': val = '}'+ node.name +'{'; break;
				case 'elseif':
				case 'else if': val = '}else if('+ this.safe(node.value) +'){'; break;

				case 'cycle':
				case 'foreach':
						node.__break = true;
						if( node.__close ){
							node.value	= '});';
						} else {
							var args	= '';
							if( node.name == 'cycle' ){
								node.value	= '__utils.cycle('+attrs.from.value+', '+attrs['to'].value+', function (){';
							} else {
								if( attrs.item ) args = attrs.item.value;
								if( attrs.key ) args += (args == '' ? '__v,' : ',') + attrs.key.value;
								node.value	= '__utils.each('+this.safe(attrs.from.value)+', function ('+args+'){';
							}
						}
					break;

				case 'pull':
						if( !node.__close ){
							var pull = { id: utils.uniqId(), name: attrs.name.value, as: attrs.as && attrs.as.value || attrs.name.value,  async: !!attrs.async, error: attrs.error && attrs.error.value || 'err' };
							if( !this._pullStack ) this._pullStack = [];
							this._pullStack.push(pull);

							val = '__buf.write(\'<span id="'+pull.id+'">\');';

							if( attrs.async ){
								val += '__buf.pull(ctx,"'+attrs.name.value+'");';
							} else {
								val += '__buf.pullSync(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){';
								input.push({ value: '});', type: node.ELEMENT_NODE });
							}
						} else {
							val	= '__buf.write(\'</span>\');';
						}
					break;

				case 'get':
						if( this._opts.stream || this.blockLevel ){
							node.name	= 'value';
							if( node.__empty ){
								val	=  '__buf.getBlock("'+attrs.name.value+'"#ctx#)';
							} else {
								val	=  node.__close ? '});' : '__buf.block("'+attrs.name.value+'",function (__buf){';
								node.__break = true;
							}
						} else {
							if( node.__empty ){
								val	=  '__buf.blockLabel("'+attrs.name.value+'",__buf.undef#ctx#);';
							} else {
								val	=  node.__close ? '});' : '__buf.blockLabel("'+attrs.name.value+'",function (__buf){';
							}
						}
						val = val.replace(/#ctx#/g, attrs.context ? ','+this.safe(attrs.context.value, true) : '');
					break;

				case 'set':
						this.blockLevel	= (this.blockLevel>>0) + (node.__close ? -1 : 1);
						val	= node.__close
								? '});'
								: (attrs.test ? 'if('+this.safe(attrs.test.value)+')' : '') + '__buf.setBlock("'+attrs.name.value+'",function(__buf#ctx#){'
							;
						val = val.replace(/#ctx#/g, attrs.context ? ','+attrs.context.value : '');
					break;

				case 'fail':
				case 'loading':
				case 'success':
						var pull = this._pullStack[this._pullStack.length-1];

						if( node.name == 'loading' ){
							return	null;
						} else {
							val	= node.__close ? '}' : 'if(' + (node.name == 'fail' ? '' : '!') +pull.error+ '){';
							if( pull.async ){
								if( node.__close ){
									val += '__buf.write(\'</span><script>(function(a,b){try{a.parentNode.insertBefore(b,a);b.style.display="";a.parentNode.removeChild(a);}catch(er){}})(__utils.$("#%id"),__utils.$("#%name%id"));</script>'.replace(/%id/g, pull.id).replace('%name', node.name)+'\'); });'
								} else {
									val = '__buf.pull(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){'
										+ '__buf.write(\'<span id="'+node.name+pull.id+'" style="display: none">\');'
										+ val;
								}
							}
						}
					break;

				default:
						val = this._myNode(node.name, node, attrs);
						if( val !== undef ){
							node.type = node.TEXT_NODE;
							if( utils.isArray(val) ){
								res = val;
								val = undef;
							}
						}
					break;
			}

			if( val !== undef ){
				node.value	= val;
			}

			return	res.length ? res : node;
		},


		_myNode: function (name, node, attrs){
			if( _tags[name] ){
				return	_tags[name].call(this, node, attrs)
			} else if( _tags['_'] ){
				return	_tags._.call(this, node, attrs);
			}
		},



	// @public
		fetch: function (ctx, fn){
			if( this._tpl === undef ){
				this._compile(this._filename, this.fetch.bind(this, ctx, fn));
				return	this;
			}

			this._tpl(ctx||{}, new Buffer(fn, this._opts.stream), utils);
		},


		loadString: function (str){
			this._string = utils.trim(str);
			this._compile();
			return	this;
		},

		
		on: function (event, fn){
			this._listeners[event] = fn;
			return	this;
		},
		

		set: function (data, val){
			if( typeof data == 'string' ){
				this._data[data] = val;
			} else {
//				this._data	= utils.extend(this._data, data);
				this._data = data || {};
			}
			return	this;
		},

		safe: function (expr, noExec){
			return	this._opts.safeMode ? '(function(){try{return '+expr+'}catch(e){return""}})'+(noExec ? '' : '()') : expr;
		},

		escape: function (expr){
			return	this._opts.escape ? '__utils.escape('+this.safe(expr)+')' : this.safe(expr);
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
	Template.SAFE_MODE		= true;
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


	Template.fromString = function (str, opts){
		return (new this(opts)).loadString(str);
	};


	Template.tags = function (tags){
		utils.each(tags, function (fn, name){
			_tags[name] = fn;
		});
		return	this;
	};

	
	Template.tags({
		'doctype': function (node, attrs){
			return	_doctype[attrs.mode && attrs.mode.value] || _doctype.def;
		}
	});
	
	
	Template.engine	= function (obj){
		if( typeof obj == 'string' ){
			obj	= require('./'+obj);
		}

		var proto = this.fn;
		proto._super = {};

		utils.each(obj.statics, function (method, name){ this[name] = method; }, this);

		utils.each(obj.fn, function (method, name){
			var prev = proto[name];
			if( prev ){
				proto._super[name] = prev;
				proto[name] = method;
			} else {
				proto[name]	= method;
			}
		});

		return	Template;
	};



	// @export
	if( typeof __build !== 'undefined' )
		__build('./AsyncTpl', Template);
	else
		module.exports = Template;
})(require('./utils'), require('./Parser'), require('./Compiler'), require('./Buffer'));
