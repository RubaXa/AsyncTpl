/*global require, __export, __utils*/

(function (utils, Node, Parser, Compiler, Buffer, undef){
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
				, blockMode:    this.self.BLOCK_MODE
				, debug:        this.self.DEBUG
			}, opts);
		},

		_uniqKey: function (x){
			var o = this._opts;
			return	o.left + o.right + o.trim + o.stream + x;
		},

		_compile: function (filename, fn){
			var key = filename === undef ? Math.random() : this._uniqKey(filename);

			if( _files[key] !== undef ){
				_files[key].done(function (tpl){ this._tpl = tpl; }.bind(this));
			}
			else if( !this._tpl && (filename === undef || _files[key] === undef) ){
				var
					  df	= utils.defer()
					, incs	= {}
				;

				_files[key]	= df.promise();

				this._load(filename, function (tpl){
					if( tpl ){
						this._tpl = tpl;
						df.resolve(this._tpl);
					} else {
						if( !this._compiler ){
							this._compiler	= new Compiler(this._opts);
						}

						this._parse(this._opts.rootDir + filename, incs, function (input){
							this._tpl = this._compiler.compile(input);
							this._save(filename, incs);
							df.resolve(this._tpl);
						}.bind(this), incs);
					}
				}.bind(this));
			}

			_files[key].done(fn);
		},


		_parse: function (filename, incs, fn){
			if( this._parser === undef ){
				this._parser = new Parser(this._opts, filename);
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

					try {
						while( node = input.shift() ){
							this._prepare(node, input, stack);

							node.prev   = this.__node;
							res         = this._trans(node, input, stack);
							this.__node = node;

							if( res !== null && node.type != node.COMMENT_NODE ){
								stack.push(res);
							}

							if( node.name == 'include' ){
								inc.push(this._parse(path + node.value, incs).done(function (idx, entry){
									stack[idx-1] = entry;
								}.bind(this, stack.length)));
							}
						}
					} catch( err ){
						inc     = [];
						stack   = [utils.error(err)];
					}

					this.__node = undef;

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

		_try: function (val, info, ret){
			if( !info ){
				if( val && val.__line ){
					info    = val;
					val     = val.value;
				} else {
					info    = {};
				}
			}
			return    'try{'+ val +'}catch(_){'
					+ (this._opts.debug && info.__line ? '__utils.error(_,'+info.__line+',"'+info.__file+'");' : '')
					+ (ret !== undef ? 'return '+ret : '')
					+ '}';
		},

		_prepare: function (node, input, stack){
			var next = input[0], name = next && next.name;

			if( next ){
				if( name == 'attrs' || name == 'attributes' ){
					node.__openTag  = true;
				}

				utils.each(next.attributes, function (attr){
					if( attr.ns == this._opts.ns ){
						this._attr(next, attr, input);
					}
				}, this);
			}
		},

		_attr: function (node, attr, input){
			/*
			var
				  idx	= Node.findClosureIdx(input, node)+1
				, ns	= this._opts.ns
				, name	= attr.name
			;

			node.removeAttr(ns+':'+attr.name);

			switch( name ){
				case 'if':
				case 'tag-if':
						var _if = node.clone(ns, 'if', { test: attr.value }), _fi = node.clone(ns, 'if', 0, 1);
						input.add(_if, 0);
						if( name == 'if' ){
							input.add(_fi, idx+1);
						} else {
							input
								.add(_fi, 2)
								.add(_if, idx + 1)
								.add(_fi, idx + 3)
							;
						}
					break;

				case 'get':
//				case 'set':
						input
							.add(node.clone(ns, name, { name: attr.value }), 3)
							.add(node.clone(ns, name, 0, 1), idx + 1)
						;
					break;
			}
			*/
		},

		_trans: function (node, input, stack){
			var res = [], val, attrs = node.attributes;

			if( this._opts.ns == node.ns || !node.ns ) switch( node.name ){
				case 'script':
						val	= ' '+this._try( input.shift().value, node )+' ';
						input.shift();
					break;

				case 'if': val = node.__close ? '}' : 'if('+this.safe(node.value, node)+'){'; break;
				case 'else': val = '}'+ node.name +'{'; break;
				case 'elseif':
				case 'else if': val = '}else if('+ this.safe(node.value, node) +'){'; break;

				case 'for':
				case 'cycle':
				case 'foreach':
						node.__break = true;
						if( node.__close ){
							node.value	= '});';
						} else {
							var args	= '';
							if( attrs['to'] ){
								val	= '__buf.cycle('
									+ node.attr('from')
									+ ', '+node.attr('to')
									+', function ('
									+ (attrs.key || attrs.item || {value:''}).value
									+ '){';
							} else {
								if( attrs.item ) args  = attrs.item.value;
								if( attrs.key )  args += (args == '' ? '__v,' : ',') + attrs.key.value;
								val	= '__buf.each('+this.safe(node.attr('from', attrs._from), node)+', function ('+args+'){';
							}
						}
					break;

				case 'pull':
						if( !node.__close ){
							var pull = { id: utils.uniqId(), name: node.attr('name'), as: attrs.as && node.attr('value') || node.attr('name'),  async: !!attrs.async, error: attrs.error && node.attr('error') || 'err' };
							if( !this._pullStack ) this._pullStack = [];
							this._pullStack.push(pull);

							val = '__buf.w(\'<span id="'+pull.id+'">\');';

							if( attrs.async ){
								val += '__buf.pull(ctx,"'+ pull.name +'");';
							} else {
								val += '__buf.pullSync(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){';
								input.push({ value: '});', type: node.ELEMENT_NODE });
							}
						} else {
							val	= '__buf.w(\'</span>\');';
						}
					break;

				case 'assign':
						var name = node.attr('name').split('.'), first = name.shift();

						if( first == 'ctx' ){
							val = '__utils.ns(ctx,"'+name.join('.')+'",';
						} else {
							input.push(Node(first, Node.VAR_NODE));
							if( name.length > 0 ){
								val  = 'if('+first+'===undef)'+first+'={};';
								val += '__utils.ns('+first+',"'+name.join('.')+'",';
							} else {
								val = first+'=(';
							}
						}

						if( attrs.type && attrs.type != 'string' ){
							val += node.attr('value');
						} else {
							val += "'"+utils.addslashes(node.attr('value'))+"'";
						}

						val += ');';
					break;

				case 'get':
						var _attrs = [], key, _attr;

						if( attrs.attrs ){
							_attr   = attrs.attrs.value;
						} else for( key in attrs ) if( key != 'name' && key != 'attrs-name' ){
							_attrs.push(this._try('a.'+key+'='+node.attr(key), node));
						}

						if( node.__empty ){
							val = '__buf.#method#("'+node.attr('name')+'",#attrs#);';
						}
						else if( node.__close ){
							val = '});';
						} else {
							if( this._opts.blockMode == 1 ){
								val = '__buf.#method#("'+node.attr('name')+'",#attrs#,function (__buf,'+(attrs['attrs-name'] && attrs['attrs-name'].value || 'attrs')+'){'
							} else {
								val     = '__buf.#method#("'+node.attr('name')+'",#attrs#)';
								_attr   = input.shift().value;
								input.shift();
							}
						}

						if( _attr ){
							if( _attrs.length ) console.log('WARNING: Can\'t use block attributes at block mode == 2');
							_attrs  = this.safe(_attr, node);
						}
						else {
							_attrs  = _attrs.length ? '(function(a){'+ _attrs.join('') +' return a})({})' : 'undef';
						}

						val = val.replace('#attrs#', _attrs).replace('#method#', this._opts.stream || this.blockLevel ? 'block' : 'blockLabel');
					break;

				case 'set':
						if( input[0].name == 'set' && input[0].__close ){
							input.shift();
							return	null;
						}

						this.blockLevel	= (this.blockLevel|0) + (node.__close ? -1 : 1);

						if( node.__close ){
							val = '});'
						} else {
							val = '';
							if( attrs.test ) val += 'if('+this.safe(node.attr('test'), node)+')';
							val += '__buf.setBlock("'+node.attr('name')+'",function(__buf,'+(attrs['attrs-name'] && node.attr('attrs-name') || 'attrs')+'){';
						}
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
									val += '__buf.w(\'</span><script>(function(a,b){try{a.parentNode.insertBefore(b,a);b.style.display="";a.parentNode.removeChild(a);}catch(er){}})(__utils.$("#%id"),__utils.$("#%name%id"));</script>'.replace(/%id/g, pull.id).replace('%name', node.name)+'\'); });'
								} else {
									val = '__buf.pull(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){'
										+ '__buf.w(\'<span id="'+node.name+pull.id+'" style="display: none">\');'
										+ val;
								}
							}
						}
					break;

				case 'part':
						if( node.__close ){
							val = 'if(ctx.__part=="'+ this.__parts.pop() +'")__buf.off();';
						}
						else {
							val = 'if(ctx.__part=="'+node.attr('name')+'")__buf.on();';
							if( !this.__parts ) this.__parts = [];
							this.__parts.push(node.attr('name'));
						}
					break;

				case 'space':
						node.type = node.TEXT_NODE;
						val = ' ';
					break;

				case 'text':
						node.type	= node.TEXT_NODE;
						if( attrs.value ){
							val = node.attr('value');
						} else {
							val	= input.shift().value;
							input.shift();
						}
					break;

				case 'attrs':
				case 'attributes':
						if( node.__close ){
							val = '';
							node.type = node.TEXT_NODE;
							if( input[0].__close && !input[0].__empty && input[0].isShort() ){
								input.shift();
								val += '/';
							}
							val += this._opts.right;
						}
						else {
							if( !node.prev || node.prev.type != node.ELEMENT_NODE || node.prev.__close ){
								utils.exception('<'+this._opts.ns+':'+node.name+'/> must be the first child', node.__line, node.__file);
							}
							return null;
						}
					break;

				case 'attr':
				case 'attribute':
						node.type = node.TEXT_NODE;
						val = node.__close ? '"' : ' '+node.attr('name')+'="';
					break;

				case 'closure':
						if( node.__close ){
							val = '})('+this.__closure.shift().join(',')+');';
						} else {
							var _attrs = [], key, _vars = [];
							val = '(function(';
							this.__closure = this.__closure || [];
							for( key in attrs ){
								_vars.push(key);
								_attrs.push(this.safe(node.attr(key), node));
							}
							val += _vars.join(',')+'){';
							this.__closure.push(_attrs);
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
			if( fn === undef ){
				fn  = ctx;
				ctx = undef;
			}

			if( this._tpl === undef ){
				this._compile(this._filename, this.fetch.bind(this, ctx, fn));
			}
			else {
				this._tpl(ctx || {}, new Buffer(fn, this._opts.stream), utils, this);
			}
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

		safe: function (expr, node, noExec){
			if( !node || !node.__line ){
				noExec  = node;
				node    = undef;
			}
			return	this._opts.safeMode
						? '(function(){'+this._try('return '+expr, node, '""')+'})'+(noExec ? '' : '()')
						: expr;
		},

		escape: function (expr, node){
			return	this._opts.escape ? '__utils.escape('+this.safe(expr, node)+')' : this.safe(expr, node);
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
	Template.BLOCK_MODE		= 1;
	Template.DEBUG	    	= true;
	Template.ROOT_DIR		= '';
	Template.COMPILE_DIR	= '';



	// @static public
	Template.fetch = function (filename, ctx, fn){
		var tpl = new this(filename), df = utils.defer(), _res = '';
		tpl.fetch(ctx, function (chunk){
			if( chunk === null || !tpl._opts.stream ){
				df.resolve(tpl._opts.stream ? _res : chunk);
			} else {
				_res += chunk;
			}
		});
		if( fn ) df.done(fn);
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
	if( typeof __export !== 'undefined' )
		__export('./AsyncTpl', Template);
	else
		module.exports = Template;
})(require('./utils'), require('./Node'), require('./Parser'), require('./Compiler'), require('./Buffer'));
