// Same as @apiparam
var apiParam = require("./parser_api_param.js");

function parse(content, source)
{
	return apiParam.parse(content, source, "Info");
}

function pushTo()
{
	return "local.info.fields." + apiParam.getGroup();
}

/**
 * Exports.
 */
module.exports = {
	parse: parse,
	pushTo: pushTo
};