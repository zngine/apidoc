define([
  "locales",
  "handlebars",
	"diffMatchPatch"
], function(locale, Handlebars, DiffMatchPatch) {
	/**
	 * Return localized Text.
	 * @param string text
	 */
	Handlebars.registerHelper("__", function(text){
		return locale.__(text);
	});

	/**
	 * Replace underscore with space.
	 * @param string text
	 */
	Handlebars.registerHelper("underscoreToSpace", function underscoreToSpace(text){
		return text.replace(/(_+)/g, " ");
	});

	Handlebars.registerHelper("apiStatusLabel", function apiStatusLabel(endpoint) {
		var labelClass = "inverse"
		var alt = "<p><strong>"+ endpoint.group.replace(/(_+)/g," ") +" - "+ endpoint.name +"</strong><br /><small>"+ endpoint.title +"</small></p>"
		if(endpoint.apistatus_active) {
			labelClass = "success"
		} else if(endpoint.apistatus_deprecated) {
			labelClass = "warning"
		} else if(endpoint.apistatus_inactive) {
			labelClass = "important"
		}
		return new Handlebars.SafeString('<a data-tooltip href="#api-'+ endpoint.group +'-'+ endpoint.name +'" alt="'+ alt +'" title="'+ alt +'"><span class="label label-'+ labelClass +'">'+ endpoint.type.toUpperCase() +' <code style="font-size: 8px;">'+ endpoint.url +'</code></span></a>')
	})

	Handlebars.registerHelper("testStatusLabel", function testStatusLabel(endpoint) {
		var labelClass = "inverse"
		var alt = "<p><strong>"+ endpoint.group.replace(/(_+)/g," ") +" - "+ endpoint.name +"</strong><br /><small>"+ endpoint.title +"</small></p>"
		if(endpoint.apitest_passing) {
			labelClass = "success"
		} else if(endpoint.apitest_failing) {
			labelClass = "important"
		}
		return new Handlebars.SafeString('<a data-tooltip href="#api-'+ endpoint.group +'-'+ endpoint.name +'" alt="'+ alt +'" title="'+ alt +'"><span class="label label-'+ labelClass +'">'+ endpoint.type.toUpperCase() +' <code style="font-size: 8px;">'+ endpoint.url +'</code></span></a>')
	})
	
	/**
	 * 
	 */
	Handlebars.registerHelper("assign", function assign(name) {
		if(arguments.length > 0)
		{
			var type = typeof(arguments[1]);
			var arg = null;
			if(type === "string" || type === "number" || type === "boolean") arg = arguments[1];
			Handlebars.registerHelper(name, function() { return arg; });
		}
	  return "";
	});

	/**
	 * 
	 */
	Handlebars.registerHelper("nl2br", function nl2br(text) {
		return _handlebarsNewlineToBreak(text);
	});

	/**
	 * 
	 */
	Handlebars.registerHelper("if_eq", function if_eq(context, options) {
		if(context === options.hash.compare) return options.fn(this);
		return options.inverse(this);
	});

	/**
	 * 
	 */
	Handlebars.registerHelper("subTemplate", function subTemplate(name, sourceContext) {
		var template = Handlebars.compile($("#template-" + name).html());
		var templateContext = $.extend({}, this, sourceContext.hash);
		return new Handlebars.SafeString( template(templateContext) );
	});
	
	/**
	 * 
	 */
	Handlebars.registerHelper("toLowerCase", function toLowerCase(value) {
		return (value && typeof value === "string") ? value.toLowerCase() : '';
	});

	Handlebars.registerHelper("toUpperCase", function toUpperCase(value) {
		return (value && typeof value === "string") ? value.toUpperCase() : '';
	});

	/**
	 * 
	 */
	Handlebars.registerHelper("splitFill", function splitFill(value, splitChar, fillChar) {
		var splits = value.split(splitChar);
		
		return new Array(splits.length).join(fillChar) + splits[splits.length - 1];
	});

	/**
	 * Convert Newline to HTML-Break (nl2br).
	 *
	 * @param {String} text
	 * @returns {String}
	 */
	function _handlebarsNewlineToBreak(text)
	{
		return (text + "").replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1" + "<br>" + "$2");
	} // _handlebarsNewlineToBreak

	/**
	 * 
	 */
	Handlebars.registerHelper("each_compare_keys", function each_compare_keys(source, compare, options) {
		var newSource = [];
		if(source)
		{
			var sourceFields = Object.keys(source);
			sourceFields.forEach(function(name) {
				var values = {};
				values["value"] = source[name];
				values["key"] = name;
				newSource.push(values);
			});
		}

		var newCompare = [];
		if(compare)
		{
			var compareFields = Object.keys(compare);
			compareFields.forEach(function(name) {
				var values = {};
				values["value"] = compare[name];
				values["key"] = name;
				newCompare.push(values);
			});
		}
		return _handlebarsEachCompared("key", newSource, newCompare, options);
	});
	
	/**
	 * 
	 */
	Handlebars.registerHelper("each_compare_field", function each_compare_field(source, compare, options) {
		return _handlebarsEachCompared("field", source, compare, options);
	});

	/**
	 * 
	 */
	Handlebars.registerHelper("each_compare_title", function each_compare_title(source, compare, options) {
		return _handlebarsEachCompared("title", source, compare, options);
	});

	/**
	 * 
	 */
	Handlebars.registerHelper("showDiff", function showDiff(source, compare, options) {
		var ds = "";
		if(source === compare) ds = source;
		else
		{
			if( ! source) return compare;
			if( ! compare) return source;
			var d = diffMatchPatch.diff_main(compare, source);
			diffMatchPatch.diff_cleanupSemantic(d);
			ds = diffMatchPatch.diff_prettyHtml(d);
			ds = ds.replace(/&para;/gm, "");
		}
		if(options === "nl2br") ds = _handlebarsNewlineToBreak(ds);
		return ds;
	});

	/**
	 * 
	 */
	function _handlebarsEachCompared(fieldname, source, compare, options)
	{
		var dataList = [];
		if(source)
		{
			source.forEach(function(sourceEntry) {
				var found = false;
				if(compare)
				{
					compare.forEach(function(compareEntry) {
						if(sourceEntry[fieldname] === compareEntry[fieldname])
						{
							var data = {
								typeSame: true,
								source: sourceEntry,
								compare: compareEntry
							};
							dataList.push(data);
							found = true;
						}
					});
				}
				if( ! found)
				{
					var data = {
						typeIns: true,
						source: sourceEntry
					};
					dataList.push(data);
				}
			});
		}

		if(compare)
		{
			compare.forEach(function(compareEntry) {
				var found = false;
				if(source)
				{
					source.forEach(function(sourceEntry) {
						if(sourceEntry[fieldname] === compareEntry[fieldname])
						{
							found = true;
						}
					});
				}
				if( ! found)
				{
					var data = {
						typeDel: true,
						compare: compareEntry
					};
					dataList.push(data);
				}
			});
		}

		var ret = "";
		for(var index in dataList)
		{
			ret = ret + options.fn(dataList[index]);
		} // for
		return ret;
	} // _handlebarsEachCompared

	var diffMatchPatch = new DiffMatchPatch();

	/**
	 * Overwrite Colors
	 */
	DiffMatchPatch.prototype.diff_prettyHtml = function(diffs) {
	  var html = [];
	  var pattern_amp = /&/g;
	  var pattern_lt = /</g;
	  var pattern_gt = />/g;
	  var pattern_para = /\n/g;
	  for (var x = 0; x < diffs.length; x++) {
	    var op = diffs[x][0];    // Operation (insert, delete, equal)
	    var data = diffs[x][1];  // Text of change.
	    var text = data.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;')
	        .replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
	    switch (op) {
	      case DIFF_INSERT:
	        html[x] = '<ins>' + text + '</ins>';
	        break;
	      case DIFF_DELETE:
	        html[x] = '<del>' + text + '</del>';
	        break;
	      case DIFF_EQUAL:
	        html[x] = '<span>' + text + '</span>';
	        break;
	    }
	  }
	  return html.join('');
	};

	return Handlebars;
});