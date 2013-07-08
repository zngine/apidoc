function parse(content)
{
  // Trim
  content = content.replace(/^\s+|\s+$/g, "");

  if(content.length === 0) return null;

  switch(content.toLowerCase()) {
    case "pass":
    case "passing":
      return { apitest_passing : true }
      break;
    case "fail":
    case "failing":
    default:
      return { apitest_failing : true }
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