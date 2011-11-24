(function(exports){

	var benches = {
		string: {
			source:  "Hello World!",
			context: {}
		},

		replace: {
			source:  'Hello <xtpl:value>ctx.name</xtpl:value>! You have <xtpl:value>ctx.count</xtpl:value> new messages.',
			context: { name: "Mick", count: 30 }
		},

		array: {
			source:  '<xtpl:foreach iterate="ctx.names" as="item"><xtpl:value>item.name</xtpl:value></xtpl:foreach>',
			context: { names: [
						{ name: "Moe" },
						{ name: "Larry" },
						{ name: "Curly" },
						{ name: "Shemp" }
					]
			}
		},

		object: {
			source:  "<xtpl:value>ctx.person.name</xtpl:value><xtpl:value>ctx.person.age</xtpl:value>",
			context: { person: { name: "Larry", age: 45 } }
		},

		filter: {
			source:  "foo <xtpl:value>ctx.bar.toUpperCase()</xtpl:value>",
			context: { bar: "bar" }
		},

		complex: {
			source:'<?xml version="1.0"?>\
				<xtpl:template xmlns:xtpl="http://rubaxa.org/">\
					<h1><xtpl:value>ctx.header</xtpl:value></h1>\
					<xtpl:choose>\
						<xtpl:when test="ctx.items.length > 0">\
							<ul>\
								<xtpl:foreach iterate="ctx.items" as="item">\
									<xtpl:choose>\
										<xtpl:when test="item.current">\
											<li><strong><xtpl:value>item.name</xtpl:value></strong></li>\
										</xtpl:when>\
										<xtpl:otherwise>\
											<li><a href="xtpl:item.url"><xtpl:value>item.name</xtpl:value></a></li>\
										</xtpl:otherwise>\
									</xtpl:choose>\
								</xtpl:foreach>\
							</ul>\
						</xtpl:when>\
						<xtpl:otherwise>\
							<p>The list is empty.</p>\
						</xtpl:otherwise>\
					</xtpl:choose>\
				</xtpl:template>',
			context: {
				header: "Colors",
				items: [
					{name: "red", current: true, url: "#Red"},
					{name: "green", current: false, url: "#Green"},
					{name: "blue", current: false, url: "#Blue"}
				]
			}
		}

	};

	var xtpl = AsyncTpl.engine('XML');

	exports.xtplBench = function(suite, name, id) {
		if( benches[name] ){
			var
				  bench = benches[name]
				, ctx = bench.context
			;

			var tpl = xtpl.fromString(bench.source);

			xtpl.ASYNC = false;
			xtpl.STREAM = false;

			suite.bench(id || name, function(next){
				tpl
					.set(ctx)
					.on('end', function (){ next(); })
					._fetch()
				;
			});
		}
	};

	
	exports.xtplBench.benches = benches;
})(typeof exports !== "undefined" ? exports : window);
