function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function doGet(e)
{
  //Render the htl template by passing the visitor_count data
  let template = HtmlService.createTemplateFromFile("index.html");
  const rendered_html = template.evaluate();
  return rendered_html;
}