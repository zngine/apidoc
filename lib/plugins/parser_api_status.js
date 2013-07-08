function parse(content)
{
  // Trim
  content = content.replace(/^\s+|\s+$/g, "");

  if(content.length === 0) return null;

  switch(content.toLowerCase()) {
    case "deprecated":
      return { apistatus_deprecated : true }
      break;
    case "inactive":
      return { apistatus_inactive : true }
      break;
    case "active":
    default:
      return { apistatus_active : true }
      break;
  }
} // parse

function pushTo()
{
  return "local";
} // pushTo

/**
 * Exports.
 */
module.exports = {
  parse: parse,
  pushTo: pushTo
};