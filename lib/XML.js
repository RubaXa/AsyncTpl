(function (utils, undef){
	'use strict';

	var XML = {
		_defaults: function (opts){
			return	this.parent(utils.extend({ ns: this.self.NS }, opts || {}, { firstLine: false }));
		},


		_trans: function(node, input){
			var res = [], val, attrs = node.attributes;

			if( node.ns != this._opts.ns ){
				if( node.type == node.ELEMENT_NODE ){
					if( !node.__empty && node.__close ){
						res.push('</'+ node.name +'>');
					} else {
						res.push('<'+node.name);
						var _rns = new RegExp(this._opts.ns+':', 'i');
						utils.each(attrs, function (attr){
							if( _rns.test(attr.value) ){
								res.push(
									  ' '+attr.name+'="'
									, { name: 'value', value: this.escape(attr.value.replace(_rns, '')) }
									, '"'
								);
							} else {
								res.push(' '+attr.name+'="'+attr.value+'"');
							}
						}, this);
						res.push(node.__empty ? '/>' : '>');
					}
				}
			} else {
				switch( node.name ){
					case 'doctype':
							val	= '<!DOCTYPE html>';
							node.type = node.TEXT_NODE;
						break;

					case 'script':
							if( !node.__close ) val = 'try{ '+ input.shift().value+' }catch(er){ }';
						break;

					case 'if':
							val	= node.__close ?  '}' : 'if('+attrs.test.value+'){';
						break;

					case 'choose':
							this.__choose	= node.__open ? 1 : 0;
						break;

					case 'when':
							val = node.__close ? '}' : (this.__choose == 1 ? '' : ' else ') + 'if('+ attrs.test.value +'){';
							this.__choose++;
						break;

					case 'otherwise':
							val	= node.__close ? '}' : ' else {';
						break;

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
									if( attrs.as ) args = attrs.as.value;
									if( attrs.index ) args += (args == '' ? '__v,' : ',') + attrs.index.value;
									node.value	= '__utils.each('+this.safe(attrs.iterate.value)+', function ('+args+'){';
								}
							}
						break;

					case 'value':
							val	= this.escape(input.shift().value);
							input.shift();
						break;

					case 'include':
							val	= attrs.src.value;
						break;

					case 'get':
							if( this._opts.stream || this.blockLevel ){
								node.name	= 'value';
								if( node.__empty ){
									val	=  '__this.getBlock("'+attrs.name.value+'")';
								} else {
									val	=  node.__close ? '}));' : '__ondata(__this.getBlock("'+attrs.name.value+'", function (__ondata){';
									node.__break = true;
								}
							} else {
								if( node.__empty ){
									val	=  '__ondata(__this.blockLabel, "'+attrs.name.value+'");';
								} else {
									val	=  node.__close ? '});' : '__ondata(__this.blockLabel, "'+attrs.name.value+'", function (__ondata){';
								}
							}
						break;

					case 'set':
							this.blockLevel	= (this.blockLevel>>0) + (node.__close ? -1 : 1);
							val	= node.__close
									? '});'
									: (attrs.test ? 'if('+this.safe(attrs.test.value)+')' : '') + '__this.setBlock("'+attrs.name.value+'",function(__ondata){'
								;
						break;

					case 'comment':
							node.type = node.TEXT_NODE;
							if( node.__empty ){
								val	= '';
							} else {
								val	= '<!--'+ input.shift().value + '-->';
								input.shift();
							}
						break;

					case 'text':
							node.type	= node.TEXT_NODE;
							val	= input.shift().value;
							input.shift();
						break;

					case 'pull':
							if( !node.__close ){
								var pull = { id: utils.uniqId(), name: attrs.name.value, as: attrs.as && attrs.as.value || attrs.name.value,  async: !!attrs.async, error: attrs.error && attrs.error.value || 'err' };
								if( !this._pullStack ) this._pullStack = [];
								this._pullStack.push(pull);

								val = '__ondata(\'<span id="'+pull.id+'">\');';

								if( attrs.async ){
									val += '__this.pull(ctx,"'+attrs.name.value+'");';
								} else {
									val += '__this.pullSync(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){';
									input.push({ value: '});', type: node.ELEMENT_NODE });
								}
							} else {
								val	= '__ondata(\'</span>\');';
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
										val += '__ondata(\'</span><script>(function(a, b){try{a.parentNode.insertBefore(b,a);b.style.display="";a.parentNode.removeChild(a);}catch(er){}})(document.getElementById("%id"), document.getElementById("%name%id"));</script>'.replace(/%id/g, pull.id).replace('%name', node.name)+'\'); });'
									} else {
										val = '__this.pull(ctx,"'+pull.name+'",function('+pull.error+','+pull.as+'){'
											+ '__ondata(\'<span id="'+node.name+pull.id+'" style="display: none">\');'
											+ val;
									}
								}
							}
						break;

					case 'default':
							
						break;

					default: return null; break;
				}
			}

			if( val !== undef ){
				node.value	= val;
			}

			return	res.length  ? res : node;
		}
	};


	// @export
	if( typeof __build !== 'undefined' )
		__build.add('./XML', XML);
	else
		module.exports = XML;
})(require('./utils'));
