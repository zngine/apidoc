require.config({
	paths: {
		bootstrap: "./vendor/bootstrap.min",
		diffMatchPatch: "./vendor/diff_match_patch.min",
		handlebars: "./vendor/handlebars.min",
		handlebarsExtended: "./handlebars_helper",
		locales: "./locales/locale",
		lodash: "./vendor/lodash.min",
		prettify: "./vendor/prettify/prettify"
	},
	shim: {
		bootstrap: {
			deps: ["jquery"],
		},
		diffMatchPatch: {
			exports: "diff_match_patch"
		},
		handlebars: {
			exports: "Handlebars"
		},
		handlebarsExtended: {
			deps: ["handlebars"],
			exports: "Handlebars"
		},
		prettify: {
			exports: "prettyPrint"
		}
	},
	urlArgs: "v=" + (new Date()).getTime()
});

require([
	"jquery",
	"lodash",
	"locales",
	"handlebarsExtended",
	"./api_project.js",
	"./api_data.js",
	"prettify",
	"bootstrap"
], function($, _, locale, Handlebars, apiProject, apiData, prettyPrint) {

	var api = apiData.api;

	/**
	 * Templates.
	 */
	var templateApidoc         = Handlebars.compile( $("#template-apidoc").html() );
	var templateArticle        = Handlebars.compile( $("#template-article").html() );
	var templateCompareArticle = Handlebars.compile( $("#template-compare-article").html() );
	var templateGenerator      = Handlebars.compile( $("#template-generator").html() );
	var templateProject        = Handlebars.compile( $("#template-project").html() );
	var templateSections       = Handlebars.compile( $("#template-sections").html() );
	var templateSidenav        = Handlebars.compile( $("#template-sidenav").html() );
	var templateRundown        = Handlebars.compile( $("#template-rundown").html() );
	
	/**
	 * Data transform.
	 */
	// Grouped by group
	var apiByGroup = _.groupBy(api, function(entry) {
		return entry.group;
	});

	var apiByName = _.groupBy(apiByGroup, function(entry) {
		return entry.name;
	})

	var apiByGroupAndRestVerb = {};

	$.each(apiByGroup, function(group, entries) {
		if(group.indexOf(".js") != -1)
			apiByGroupAndRestVerb[group] = entries
		else
			apiByGroupAndRestVerb[group] = _.groupBy(entries, function(entry) {
				if(_.has(entry, "type"))
					return entry.type;
			});
	})

	// Now sort the items inside each REST Verb section of each group
	var apiByGroupAndRestVerbSorted = {};

	$.each(apiByGroupAndRestVerb, function(group, verbs) {

		if(group.indexOf(".js") != -1) {
			apiByGroupAndRestVerbSorted[group] = verbs
			return
		}
		apiByGroupAndRestVerbSorted[group] = {}

		$.each(verbs, function(verb, endpoints) {

			if(!endpoints)
				return

			apiByGroupAndRestVerbSorted[group][verb] = _.sortBy(endpoints, function(endpoint) {
				return endpoint.name
			})
		})

	});


	/**
	 * Sort api by group - name - title.
	 */
	var newList = [];
	var umlauts = { "ä": "ae", "ü": "ue", "ö": "oe", "ß": "ss" };
	$.each(apiByGroupAndRestVerbSorted, function(group, verbs) {
		if(group.indexOf(".js") != -1)
			return

		// Titel der ersten Einträge von group[].name[] ermitteln (name hat Versionsliste)
			
		var titles = {};
		$.each(verbs, function(verb, endpoints) {
			$.each(endpoints, function(index, endpoint) {
				
				var title = endpoint.title;
				if(title)
					title.toLowerCase().replace(/[äöüß]/g, function($0) { return umlauts[$0]; });

				newList.push( endpoint )
			})
		}); // each
	}); // each

	api = newList;

	/**
	 * Group- and Versionlists.
	 */
	var apiGroups = {};
	var apiVersions = {};
	apiVersions[apiProject.version] = 1;

	$.each(api, function(index, entry) {
		apiGroups[entry.group] = 1;
		apiVersions[entry.version] = 1;
	});

	// Sort.
	apiGroups = Object.keys(apiGroups);

	apiVersions = Object.keys(apiVersions);
	apiVersions.sort();
	apiVersions.reverse();

	/**
	 * Create Navigationlist.
	 */
	var nav = [];
	var rundown = {
		totals : {
			endpoints : 0,
			groups : 0
		},
		tests_passing : [],
		tests_failing : [],
		tests_unknown : [],
		endpoints_active : [],
		endpoints_deprecated : [],
		endpoints_inactive : [],
		endpoints_unknown : [],
		todos : []
	}

	var processEndpointRundown = function(entry, group) {
		rundown.totals.endpoints++

		if(entry.apistatus_active) {
			rundown.endpoints_active.push( entry )
		} else if(entry.apistatus_deprecated) {
			rundown.endpoints_deprecated.push( entry )
		} else if(entry.apistatus_inactive) {
			rundown.endpoints_inactive.push( entry )
		} else {
			rundown.endpoints_unknown.push( entry )
		}

		if(entry.apitest_passing) {
			rundown.tests_passing.push( entry )
		} else if(entry.apitest_failing) {
			rundown.tests_failing.push( entry )
		} else {
			rundown.tests_unknown.push( entry )
		}

		if(entry.todo) {
			rundown.todos.push( entry )
		}
	}

	_.each(apiByGroupAndRestVerbSorted, function(verbs, group) {

		if(group.indexOf(".js") != -1)
			return

		// Valid group, get processing!
		rundown.totals.groups++

		// Mainmenu-Entry.
		nav.push({
			group: group,
			isHeader: true,
			title: group
		});

		// Add Submenu.
		var oldName = "";
		_.each(verbs, function(endpoints, verb) {
			nav.push({
				verb : verb,
				isVerb : true,
				title : verb,
				group : group
			})

			_.each(endpoints, function(entry) {

				processEndpointRundown(entry, group)

				nav.push({
					title: entry.title,
					group: group,
					name: entry.name,
					type: entry.type,
					version: entry.version
				});
			})
		})
	}); // forEach

	// Mainmenu "General" Entry.
	if(apiProject.apidoc)
	{
		nav.push({
			group: "_",
			isHeader: true,
			title: locale.__("General"),
			isFixed: true
		});
	}

	/**
	 * Render Pagetitle.
	 */
	var title = apiProject.name + " - " + apiProject.version;
	$(document).attr("title", "apiDoc: " + title);

	/**
	 * Render Sidenav.
	 */
	var fields = {
		nav: nav
	};
	$("#sidenav").append( templateSidenav(fields) );

	/**
	 *  Render Generator.
	 */
	$("#generator").append( templateGenerator(apiProject) );
	
	/**
	 * Render Project.
	 */
	_.extend(apiProject, { versions: apiVersions});
	$("#project").append( templateProject(apiProject) );

	/**
	 * Render ApiDoc, general documentation.
	 */
	$("#apidoc").append( templateApidoc(apiProject) );

	/**
	 * Render Project Rundown
	 */
	console.log("Rundown", rundown)
	$("#rundown").append( templateRundown(rundown) );

	/**
	 *  Render Sections and Articles
	 */
	var articleVersions = {};
	apiGroups.forEach(function(groupEntry) {
		var articles = [];
		var oldName = "";
		var fields = {};
		articleVersions[groupEntry] = {};
		// Render all Articls of a group.
		api.forEach(function(entry) {
			if(groupEntry === entry.group)
			{
				if(oldName !== entry.name)
				{
					// Artikelversionen ermitteln.
					api.forEach(function(versionEntry) {
						if(groupEntry === versionEntry.group && entry.name === versionEntry.name)
						{
							if( ! articleVersions[entry.group][entry.name]) articleVersions[entry.group][entry.name] = [];
							articleVersions[entry.group][entry.name].push(versionEntry.version);
						}
					});
					fields = {
						article: entry,
						versions: articleVersions[entry.group][entry.name]
					};
				}
				else
				{
					fields = {
						article: entry,
						hidden: true,
						versions: articleVersions[entry.group][entry.name]
					};
				}

				if(entry.parameter && entry.parameter.fields) fields._hasTypeInParameterFields = _hasTypeInFields(entry.parameter.fields);
				if(entry.error && entry.error.fields) fields._hasTypeInErrorFields = _hasTypeInFields(entry.error.fields);
				if(entry.success && entry.success.fields) fields._hasTypeInSuccessFields = _hasTypeInFields(entry.success.fields);
				if(entry.info && entry.info.fields) fields._hasTypeInInfoFields = _hasTypeInFields(entry.info.fields);

				articles.push({
					article: templateArticle(fields),
					group: entry.group,
					name: entry.name
				});
				oldName = entry.name;
			}
		}); // forEach

		// Render Section with Articles.
		var fields = {
			group: groupEntry,
			title: groupEntry,
			articles: articles
		};
		$("#sections").append( templateSections(fields) );
	}); // forEach

	/**
	 * Initialize Tooltips
	 */
	$("a[data-tooltip]").tooltip({
		html : true
	})

	/**
	 * Bootstrap Scrollspy.
	 */
	$("body").scrollspy({ offset: 25 });

	// Content-Scroll on Navigation click.
	$(".sidenav").find("a").on("click", function(e) {
		e.preventDefault();
		var id = $(this).attr("href");
		$('html,body').animate({ scrollTop: parseInt($(id).offset().top) - 18 }, 400);
		window.location.hash = $(this).attr("href");
	});

	// Quickjump on Pageload to hash position.
	if(window.location.hash)
	{
		var id = window.location.hash;
		$('html,body').animate({ scrollTop: parseInt($(id).offset().top) - 18 }, 0);
	}

	/**
	 * Check if Parameter (sub) List has a type Field.
	 * Example: @apaSuccess          varname1 No type.
	 *          @apaSuccess {String} varname2 With type.
	 *
	 * @param {Object} fields 
	 */
	function _hasTypeInFields(fields)
	{
		hasField = false;
		$.each(fields, function(name) {
			if(_.any(fields[name], function(item) { return item.type; }) )
			{
				hasField = true;
			}
		});
		return hasField;
	} // _hasTypeInFields

	/**
	 * On Template changes, recall plugins.
	 */
	function initDynamic()
	{
	  // Bootstrap Popover.
		$("a[data-toggle=popover]")
			.popover()
			.click(function(e) {
				e.preventDefault();
			})
		;

		var version = $("#version strong").html();
		$("#sidenav li").removeClass("is-new");
		$("#sidenav li[data-version=\"" + version + "\"]").each(function(){
			var group = $(this).data("group");
			var name = $(this).data("name");
			var length = $("#sidenav li[data-group=\"" + group + "\"][data-name=\"" + name + "\"]").length;
			var index  = $("#sidenav li[data-group=\"" + group + "\"][data-name=\"" + name + "\"]").index($(this));
			if(length === 1 || index === (length - 1))
			{
				$(this).addClass("is-new");
			}
		});
	} // initDynamic
	initDynamic();

	/**
	 * Pre- / Code-Format.
	 */
	prettyPrint();

	/**
	 * HTML-Template specific jQuery-Functions
	 */
	// Change Main Version
	$("#versions li.version a").on("click", function(e) {
		e.preventDefault();

		var selectedVersion = $(this).html();
		$("#version strong").html(selectedVersion);

		// Hide all
		$("article").addClass("hide");
		$("#sidenav li:not(.nav-fixed)").addClass("hide");

		// Show 1st equal or lower Version of each entry
		$("article[data-version]").each(function(index) {
			var group = $(this).data("group");
			var name = $(this).data("name");
			var version = $(this).data("version");
			
			if(version <= selectedVersion)
			{
				if($("article[data-group=\"" + group + "\"][data-name=\"" + name + "\"]:visible").length === 0)
				{
					// Enable Article
					$("article[data-group=\"" + group + "\"][data-name=\"" + name + "\"][data-version=\"" + version + "\"]").removeClass("hide");
					// Enable Navigation
					$("#sidenav li[data-group=\"" + group + "\"][data-name=\"" + name + "\"][data-version=\"" + version + "\"]").removeClass("hide");
					$("#sidenav li.nav-header[data-group=\"" + group + "\"]").removeClass("hide");
				}
			}
		});
		
		initDynamic();
		return;
	});

	// On click compare all currently selected Versions with their predecessor.
	$("#compareAllWithPredecessor").on("click", changeAllVersionCompareTo);

	// On change the Version of an article. 
	$("article .versions li.version a").on("click", changeVersionCompareTo);
	
	/**
	 * 
	 */
	function changeVersionCompareTo(e)
	{
		e.preventDefault();

		var $root = $(this).parents("article");
		var selectedVersion = $(this).html();
		var $button = $root.find(".version");
		var currentVersion = $button.find("strong").html();
		$button.find("strong").html(selectedVersion);
		
		var group = $root.data("group");
		var name = $root.data("name");
		var version = $root.data("version");
		
		var compareVersion = $root.data("compare-version");

		if(compareVersion === selectedVersion) return;
		if( ! compareVersion && version == selectedVersion) return;
		
		if(    compareVersion && articleVersions[group][name][0] === selectedVersion
				|| version === selectedVersion
		)
		{
			// Version des Eintrages wurde wieder auf höchste Version gesetzt (reset)
			resetArticle(group, name, version);
		}
		else
		{
			var $compareToArticle = $("article[data-group=\"" + group + "\"][data-name=\"" + name + "\"][data-version=\"" + selectedVersion + "\"]");

			var sourceEntry = {};
			var compareEntry = {};
			$.each(apiByGroupAndRestVerbSorted[group][name], function(index, entry) {
				if(entry.version === version) sourceEntry = entry;
				if(entry.version === selectedVersion) compareEntry = entry;
			});

			var fields = {
				article: sourceEntry,
				compare: compareEntry,
				versions: articleVersions[group][name]
			};

			var entry = sourceEntry;
			if(entry.parameter && entry.parameter.fields) fields._hasTypeInParameterFields = _hasTypeInFields(entry.parameter.fields);
			if(entry.error && entry.error.fields) fields._hasTypeInErrorFields = _hasTypeInFields(entry.error.fields);
			if(entry.success && entry.success.fields) fields._hasTypeInSuccessFields = _hasTypeInFields(entry.success.fields);
			if(entry.info && entry.info.fields) fields._hasTypeInInfoFields = _hasTypeInFields(entry.info.fields);

			var entry = compareEntry;
			if(fields._hasTypeInParameterFields !== true && entry.parameter && entry.parameter.fields) fields._hasTypeInParameterFields = _hasTypeInFields(entry.parameter.fields);
			if(fields._hasTypeInErrorFields !== true && entry.error && entry.error.fields) fields._hasTypeInErrorFields = _hasTypeInFields(entry.error.fields);
			if(fields._hasTypeInSuccessFields !== true && entry.success && entry.success.fields) fields._hasTypeInSuccessFields = _hasTypeInFields(entry.success.fields);
			if(fields._hasTypeInInfoFields !== true && entry.info && entry.info.fields) fields._hasTypeInInfoFields = _hasTypeInFields(entry.info.fields);

			var content = templateCompareArticle(fields);
			$root.after(content);
			var $content = $root.next();

			// Event on.click muss neu zugewiesen werden (sollte eigentlich mit on automatisch funktionieren... sollte)
			$content.find(".versions li.version a").on("click", changeVersionCompareTo);
			
			// Navigation markieren
			$("#sidenav li[data-group=\"" + group + "\"][data-name=\"" + name + "\"][data-version=\"" + currentVersion + "\"]").addClass("has-modifications");

			$root.remove(); 
			// todo: bei Hauptversionswechsel oder zurückstellen auf höchste Eintragsversion, den Eintrag neu rendern
		}

		initDynamic();
		return;
	} // changeVersionCompareTo

	/**
	 * 
	 */
	function changeAllVersionCompareTo(e)
	{
		e.preventDefault();
		$("article:visible .versions").each(function(){
			var $root = $(this).parents("article");
			var currentVersion = $root.data("version");
			var $foundElement = null;
			$(this).find("li.version a").each(function() {
				var selectVersion = $(this).html();
				if(selectVersion < currentVersion && ! $foundElement)
				{
					$foundElement = $(this);
				}
			});
			
			if($foundElement)
			{
				$foundElement.trigger("click");
			}
		});

		initDynamic();
		return;
	} // changeAllVersionCompareTo

	/**
	 * Render an Article.
	 */
	function renderArticle(group, name, version)
	{
		var entry = {};
		$.each(apiByGroupAndRestVerbSorted[group][name], function(index, currentEntry) {
			if(currentEntry.version === version) entry = currentEntry;
		});
		var fields = {
			article: entry,
			versions: articleVersions[group][name]
		};

		if(entry.parameter && entry.parameter.fields) fields._hasTypeInParameterFields = _hasTypeInFields(entry.parameter.fields);
		if(entry.error && entry.error.fields) fields._hasTypeInErrorFields = _hasTypeInFields(entry.error.fields);
		if(entry.success && entry.success.fields) fields._hasTypeInSuccessFields = _hasTypeInFields(entry.success.fields);
		if(entry.info && entry.info.fields) fields._hasTypeInInfoFields = _hasTypeInFields(entry.info.fields);

		return templateArticle(fields);
	} // renderArticle

	/**
	 * Render the original Article and remove the current visible Article.
	 */
	function resetArticle(group, name, version)
	{
		var $root = $("article[data-group=\"" + group + "\"][data-name=\"" + name + "\"]:visible");
		var content = renderArticle(group, name, version);

		$root.after(content);
		var $content = $root.next();

		// Event on.click muss neu zugewiesen werden (sollte eigentlich mit on automatisch funktionieren... sollte)
		$content.find(".versions li.version a").on("click", changeVersionCompareTo);

		$("#sidenav li[data-group=\"" + group + "\"][data-name=\"" + name + "\"][data-version=\"" + version + "\"]").removeClass("has-modifications");
		
		$root.remove(); 
		return;
	} // resetArticle
});