/*global require, __export, __utils*/

(function (utils, Node, Parser, Compiler, Buffer, undef){
	'use strict';

	var
		  _guid = 0
		, _tags = {}
		, _ctags = {}
		, _doctype = {
			  def: '<!DOCTYPE html>'
			, strict: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
			, loose: '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'
			, xstrict: '<!DOCTYPE html PUBLIC  "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">'
			, transitional: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">'
			, xhtml: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
		}
		, _rforeach = /^(.+)\s+as\s+(?:(.+)\s*=>\s*)?([^$]+)/i
		, _rxattr = /\{\*(.*?)\*\}/g
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


		_compile: function (filename, fn){
			if( this._tpl === undef ){
				var
					  df	= utils.defer().done(fn)
					, incs	= {}
				;

				this._load(filename, function (tpl){
					if( tpl ){
						this._tpl = tpl;
						df.resolve(this._tpl);
					}
					else {
						if( !this._compiler ){
							this._compiler	= new Compiler(this._opts);
						}

						this._parse(this._opts.rootDir + filename, incs, function (input){
							this._tpl = this._compiler.compile(input);
							this._save(filename, incs);
							df.resolve(this._tpl);
						}.bind(this));
					}
				}.bind(this));
			}
			else {
				fn(this._tpl);
			}
		},


		_parse: function (filename, incs, fn, sub){
			if( this._parser === undef ){
				this._parser = new Parser(this._opts, filename);
			}

			var
				  opts = this._opts
				, df = utils.defer()
				, loaded = function (input){
					var
						  inc	= []
						, path	= filename.replace(/\/[\s%|\w\._-]+$/, '/')
						, node
						, name
						, i = 0
					;

					input = this._parser.parse(input);

					while( node = input[i] ){
						name = node.name;
						if( name == 'include' || name == 'extends' ){
							inc.push(this._parse(path + node.attrAny('src file', true), incs, 0, 1).done(function (idx, entry){
								input.splice(idx, 1);
								input.addMulti(entry, idx);
							}.bind(this, i)));
						}
						i++;
					}

					utils.defer.when(inc).done(function (){
						df.resolve(sub ? input : this._processing(input));
					}.bind(this));
				}.bind(this)
			;

			if( this._string !== undef ){
				loaded(this._string);
			} else {
				if( !incs[filename] ){
					incs[filename] = utils.mtime(filename);
				}

				utils.load(filename, opts.async, opts.encoding, loaded);
			}

			return	df.done(fn).promise();
		},


		_processing: function (input){
			var i = 0, node, stack = [], res;

			while( i in input ){
				this._pre(node = input[i], i, input);
				i++;

			}

//			Node.trace(input, this._opts);

			try {
				while( node = input.shift() ){
					this._prepare(node, input, stack);

					node.prev   = this.__node;
					res         = this._trans(node, input, stack);
					this.__node = node;

					if( res !== null && node.type != node.COMMENT_NODE ){
						stack.push(res);
					}
				}
			}
			catch( err ){
				stack   = [utils.error(err)];
			}

			this.__node = undef;
			return	this._normalizeStack(stack);
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


		_pre: function (node, idx, input){
			var
				  ns		= this._opts.ns
				, val
				, attrs		= node.attributes
				, _idx		= Node.findClosureIdx(input, node, idx)
				, _before0	= utils.Array()
				, _after0	= utils.Array()
				, _before1	= utils.Array()
				, _after1	= utils.Array()
			;


			switch( node.name ){
				case 'tag':
						!node.__close && (_ctags[node.attr('name')] = 1);
					break;
			}


			if( typeof attrs != 'string' ) utils.each(attrs, function (attr, name){
				// attrs
				if( ns && attr.ns == ns ){
					node.removeAttr(name);

					val		= attr.value;
					name	= attr.name;

					switch( name ){
						case 'if':
						case 'tag-if':
								var _if = ['if', { test: val }], _fi = ['if', 0, 1];

								if( name == 'if' ){
									_before0.addOrder(_if, 0); // if-open
									_after1.addOrder(_fi, 5); // if-close
								} else {
									_before0.addOrder(_if, 3); // tag-if open (top)
									_after0.addOrder(_fi, 2); // tag-if close (top)
									_before1.addOrder(['if', { test: val }], 3);  // tag-if close (bottom)
									_after1.addOrder(['if', 0, 1], 2); // tag-if open (bottom)
								}
							break;

						case 'val':
						case 'value':
								_after0
									.addOrder(['val'], 6)
									.addOrder(['<text>', 0, 0, val], 7)
									.addOrder(['val', 0, 1], 8)
								;

								if( node.__empty ){
									node.__empty	=
									node.__close	= 0;
									input.add(node.clone('', node.name, node.type, 0, 1), idx+1);
								}
							break;

						case 'set':
								_before0.addOrder(['set', { name: val }], 1); // open
								_after1.addOrder(['set', 0, 1], 4); // close
							break;

						case 'get':
								_after0.addOrder(['get', { name: val }], 3); // open

								if( node.__empty ){
									_idx = idx + 1;
									node.__empty =
									node.__close = 0;
									input.add(node.clone('', node.name, node.type, 0, 1), _idx);
								}

								_before1.addOrder(['get', 0, 1], 1); // close
							break;

						case 'foreach':
						case 'inner-foreach':
								val = val.match(_rforeach);

								var
									  attrs = { iterate: val[1] }
									, _for = ['foreach', attrs]
									, _rof = ['foreach', 0, 1]
								;

								if( val[2] ) attrs.index = val[2], attrs.as = val[3];
								else attrs.as = val[3];

								if( name == 'foreach' ){
									_before0.addOrder(_for, 2); // open
									_after1.addOrder(_rof, 3); // close
								} else {
									_after0.addOrder(_for, 5); // open
									_before1.addOrder(_rof, 0); // close
								}
							break;

						case 'class':
								node.addAttr('class', node.attrVal('class', '') + ' {*__utils.joinObj('+val+')*}');
							break;
					}
				}
			}, this);

			input.addMulti(_after1.order().map(_toNode), _idx+1);
			input.addMulti(_before1.order().map(_toNode), _idx);

			input.addMulti(_after0.order().map(_toNode), idx+1);
			input.addMulti(_before0.order().map(_toNode), idx);

			function _toNode(args){
				return	node.c.apply(node, [ns].concat(args));
			}
		},


		_prepare: function (node, input, stack){
			var next = input[0], name = next && next.name;

			if( next ){
				if( name == 'attrs' || name == 'attributes' ){
					node.__openTag  = true;
				}
			}
		},

		_trans: function (node, input, stack){
			var
				  val
				, res	= []
				, name	= node.name
				, value	= node.value
				, attrs = node.attributes
			;

			if( this._opts.ns == node.ns || !node.ns ) switch( name ){
				case 'script':
						val	= ' '+this._try( input.shift().value, node )+' ';
						input.shift();
					break;

				case 'if':
						val = node.__close ? '}' :
							'__XIF=false;'+ this._try('__XIF=('+value+')', node) +'if(__XIF){';
					break;

				case 'else': val = '}'+ name +'{'; break;
				case 'elseif':
				case 'else if': val = '}else if('+ this.safe(value, node) +'){'; break;

				case 'for':
				case 'cycle':
				case 'foreach':
						node.__break = true;
						if( node.__close ){
							val	= '});';
						} else {
							var args	= '';
							if( attrs['to'] ){
								val	= '__buf.cycle('
									+ node.attr('from')
									+ ', '+node.attr('to')
									+', function ('
									+ (attrs.key || attrs.item || { value: '' }).value
									+ '){';
							} else {
								if( attrs.item ) args  = attrs.item.value;
								if( attrs.key )  args += (args == '' ? '__v,' : ',') + attrs.key.value;

								val	= '__XFOR=0;'+this._try('__XFOR='+node.attr('from', attrs._from), node)+
									'__buf.each(__XFOR, function ('+args+'){';
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
						var
							  name	= node.attr('name').split('.')
							, first	= name.shift()
							, type	= attrs.type && attrs.type.value || 'string'
						;

						val	= '';

						if( first == 'ctx' ){
							val = '__utils.ns(ctx,"'+name.join('.')+'",';
						}
						else {
							if( type != 'var' ){
								input.push(Node(first, Node.VAR_NODE));
							}
							else {
								val = 'var '+first+';';
							}

							if( name.length > 0 ){
								val += 'if('+first+'===undef)'+first+'={};';
								val += '__utils.ns('+ first +',"'+ name.join('.') +'",';
							}
							else {
								val += first +'=(';
							}
						}

						if( type != 'string' ){
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
								val     = '__buf.#method#("'+node.attr('name')+'",#attrs#);';
								_attr   = input.shift().value;
								input.shift();
							}
						}

						if( _attr ){
							if( _attrs.length ) console.log('WARNING: Can\'t use block attributes at block mode == 2');
							val		= '__XATTR="";'+this._try('__XATTR='+_attr, node)+val;
							_attrs  = '__XATTR';
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

						if( name == 'loading' ){
							return	null;
						} else {
							val	= node.__close ? '}' : 'if(' + (name == 'fail' ? '' : '!') +pull.error+ '){';
							if( pull.async ){
								if( node.__close ){
									val += '__buf.w(\'</span><script>(function(a,b){try{a.parentNode.insertBefore(b,a);b.style.display="";a.parentNode.removeChild(a);}catch(er){}})(__utils.$("#%id"),__utils.$("#%name%id"));</script>'.replace(/%id/g, pull.id).replace('%name', node.name)+'\'); });'
								} else {
									val = '__buf.pull(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){'
										+ '__buf.w(\'<span id="'+name+pull.id+'" style="display: none">\');'
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
						if( node.__empty ){
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
								utils.exception('<'+this._opts.ns+':'+name+'/> must be the first child', node.__line, node.__file);
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

				case 'tag':
						val = node.__close ? '}' : ('function __xtag_'+ node.attr('name').replace(/-/g, '_') +'(__buf,'
								+ (attrs.context && attrs.context.value || 'tag')
								+ ',__inner){'
							);
					break;

				case 'tag-inner':
						val	= 'if(__inner!==undef)__inner();';
					break;

				case 'bind':
						var item = this.__bind;
						if( node.__close ){
							val = '} '+ item.n +'.id=__XBIND; function _'+ item.n +'(){'
								+ 'console.time("'+ item.d +'");'
								+ 'var buf=new __buf.constructor,node=document.getElementById('+ item.n +'.id);'
								+ 'if(node){'+ item.n +'('+ item.d +'.toJSON(),buf);node.innerHTML=buf.toStr();'
								+ '}else{'+ item.d +'.off("all", __'+ item.n +')}'
								+ 'console.timeEnd("'+ item.d +'");'
								+ '}'
								+ 'function __'+ item.n +'(){'
								+ 'clearTimeout('+ item.n +'.pid);'
								+ item.n +'.pid=setTimeout(_'+ item.n +','+ item.m +');'
								+ '} '
								+ item.d +'.on("all", __'+ item.n +');'
							;
						} else {
							this.__bind = item = {
								  n: '__xbind_'+ ++_guid
								, d: node.attr('data')
								, a: node.attr('as')
								, m: node.attrAny('delay') || 30
								, t: node.attrAny('tag') || 'div'
							};
							val	= '__XBIND=__buf.uniqId();__buf.w(\'<'+ item.t +' id="\'+__XBIND+\'">\');'
								+ item.n +'('+ item.d +'.toJSON(),__buf);'
								+ '__buf.w("</'+ item.t +'>");'
								+ 'function '+ item.n +'('+ item.a +',__buf){'
							;
						}
					break;

				default:
						if( name in _ctags ){
							// Custom tags
							if( !node.__empty && node.__close ){
								val	= '});';
							} else {
								val = '__XTAG={};';
								if( attrs.context ){
									val += this._try('__XTAG='+attrs.context.value, node);
								} else {
									utils.each(attrs, function (attr, key){
										key  = '__XTAG["'+key+'"]';
										val	+= key +'="'+ attr.value.replace(_rxattr, function (a, xattr){
												return	'";'+ this._try(key +'+='+ xattr, node) + key +'+="';
											}.bind(this))+ '";';
									}, this);
								}
								val	+= '__xtag_'+ name.replace(/-/g, '_') +'(__buf,__XTAG'+ (node.__empty ? ');' : ',function(){');
							}
						} else {
							val = this._myNode(name, node, attrs);
							if( val !== undef ){
								node.type = node.TEXT_NODE;
								if( utils.isArray(val) ){
									res = val;
									val = undef;
								}
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
		compile: function (fn){
			fn = fn || function (){};
			if( this._tpl === undef ){
				this._compile(this._filename, fn);
			} else {
				fn(this._tpl);
			}
			return	this._tpl;
		},

		fetch: function (ctx, fn){
			if( fn === undef ){
				fn  = ctx;
				ctx = undef;
			}

			if( this._tpl === undef ){
				this._compile(this._filename, this.fetch.bind(this, ctx, fn));
			}
			else {
				this._tpl.prototype.fns		= this.fns;
				this._tpl.prototype.mods	= this.mods;

				new this._tpl(ctx || {}, new Buffer(fn, this._opts.stream), utils);
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
		var tpl = new Template(filename), df = utils.defer(), _res = '';
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

	Template.compile = function (filename){
		var tpl	= new Template(filename, { async: false });
		return	tpl.compile();
	};


	Template.fromString = function (str, opts){
		return (new Template(opts)).loadString(str);
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


	Template.mods = function (mods){
		utils.extend(utils.mods, mods);
	};



	// @export
	if( typeof __export !== 'undefined' )
		__export('./AsyncTpl', Template);
	else
		module.exports = Template;
})(require('./utils'), require('./Node'), require('./Parser'), require('./Compiler'), require('./Buffer'));
