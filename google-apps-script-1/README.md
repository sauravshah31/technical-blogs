# Using Google Apps Script : Create a todo web app
```
I have added links to the terms I used in this blog. You don't need to click on every link as you come across them (I have been there and it's very overwhelming). I recommend you go throught the entire tutorial once, without cliking any links. You can go refer to the link later, to understand more.
```
## Topics covered
* [Why to use Apps Script](#why-to-use-apps-script)
* [Getting started with google apps script](#getting-started-with-google-apps-script)
* [Create a todo app: Getting started](#create-a-todo-app-getting-started)
* [Google script: Server side GET and POST endpoints](#google-script-server-side-get-and-post-endpoints)
* [Rendering client-side UI using HTMLService](#rendering-client-side-ui-using-htmlservice)
* [Communicating with the server](#communicating-with-the-server)
* [Templated HTML: Dynamic HTML rendering](#templated-html-dynamic-html-rendering)
* [Refactoring code into html, css, js and gs files](#refactoring-code-into-html-css-js-and-gs-files)
* [Building client side ui](#building-client-side-ui)
* [Building server side API](#nuilding-server-side-api)

### Why to use Apps Script
Google Apps Script is a development platform provided by Google that can be used to create applications that integrate with Google workspace. Using [app services](https://developers.google.com/apps-script/reference) you can easily access Google apps like docs, sheets, drive, etc. and automate stuff in JavaScript. You can use app script to create [add-ons](https://developers.google.com/workspace/add-ons/overview), create a client-facing [web app](https://developers.google.com/apps-script/guides/web), [automate stuff](https://developers.google.com/apps-script/quickstart/automation), use it as a backend server for your simple apps or create fun projects. The app script is based on JavaScript, so knowing the basics of JS should be enough to [get started](https://developers.google.com/apps-script/overview).


### Getting started with google apps script
Let's get started. Go to [script.new](script.new) to create a new Google app script. Let's give the project a name `CoolTodoApp`.
![New Project](./.notes/new-project.png)
Google App script allows two kinds of files
1. Script file : This is the .gs file (eg: code.gs) that contains server-side logic
2. HTML : This is the html file that can be used to build UI. The js and css logic also goes in this file

You can add multiple files to your project. For the `Script file`, all the objects are exposed globally. This means you can use the objects defined / declared in one file from any file without needing to import them. For `HTML file`, the server GET endpoint renders a single HTML file. You can then use server-side functions to "import" / "include" other html files. You will have clarity once we start using these later.

Now, let's try printing something in the console. Add some console log statements in `myFunction` function and try running the function. 
![Run myFunction](./.notes/run-myFunction.png)
You can see the "Execution log". This method of running can be used to debug your code or test some functions. To the left of `Run` button, there is a `Debug Button`. You can add [breakpoints](https://en.wikipedia.org/wiki/Breakpoint) by clicking the line no, then run the function step by step. This is very helpful to debug code.


### Create a todo app: Getting started
Now we can start creating our app. In this tutorial, we will be creating a todo app with a custom client-facing ui. We will be storing the todo list of a day in a spreadsheet. The spreadsheets for the entire month will be stored inside the month folder in the google drive. We will also set up a notification event, that will send an email on the first of every month with the summary of todos for the previous month.

Before starting to code, we need to think of the requirements of our app. We will have a client-facing ui that lists the todos for the day and allows to add/remove todos, and a server that stores the data. Our requirement is simple:
1. Client facing ui shall have to display the following
    * List of todos for the day, and a button to delete it
    * An input field that allows the user to add new todo task
2. The server shall handle the following
    * Return list of todos for a day
    * Store any new todo task
    * Send email on the first of every month with the summary of the previous month

Now that we have the product requirements clear, we can start with the technical requirements. This includes the ui design, the server architecture and choices, etc. We will start with the ui design. I have created this simple ui in Figma for our web app. A rough sketch of the ui in the paper should also be enough to get started. 

![Todo App UI](./.notes/Todo-App-Ui.png)

Now we can start thinking about the how server should handle the requests. We know using app scripts we can interact with spreadsheet, drive, docs, etc. We will use google spreadsheets to store the user todos. To keep things organized, we create a new spreadsheet for each day. We also create a folder for each month and store all the spreadsheets for a month in the respective folders. For the monthly report, we will summarize the data from all the spreadsheets and create a PDF file. We will then send this pdf file to the email as an attachment. We know these operations are possible using [app script services](https://developers.google.com/apps-script/reference), but don't know how to do it yet. Throughout this tutorial, you will learn different aspects of Google app script and app services, and use it to build a complete todo app.



### Google script: Server side GET and POST endpoints
Before starting to code, let's see how gs (Google script) can be used as a server. Two common methods to talk to a server are [GET](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET) and [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST). So, we need a way to handle these two requests in gs. App Scripts provides [two functions](https://developers.google.com/apps-script/guides/web) to handle these requests: `doGet(e)`, `doPost(e)`. The `e` is the request parameter and contains the request data. Refer to the [documentation](https://developers.google.com/apps-script/guides/web) to know more. 

So, we have to define these functions in our `gs` script file, and the return value will be returned as a response to the user. The return value should be of type [HtmlOutput](https://developers.google.com/apps-script/reference/html/html-output) or [TextOutput](https://developers.google.com/apps-script/reference/content/text-output), otherwise, you will get an error. To return a value of this type, you can use [HtmlService](https://developers.google.com/apps-script/reference/html/html-service) or [Content Service](https://developers.google.com/apps-script/reference/content). A service in google apps script is a utility class that contains useful methods that you can use to interact with google apps.

Let's modify the `Code.gs` file. First, let's clean up by removing the `myFunction` function. Then, add `doGet` function and return some string using [`HtmlService.createHtmlOutput(html)`](https://developers.google.com/apps-script/reference/html/html-service#createHtmlOutput(String)) function
```js
function doGet(e)
{
  return HtmlService.createHtmlOutput("This is a cool web todo web app made using google app script");
}
```  

Now, you need to deploy your web app. Click `Deploy` (on the top right) and select `Test deployments`. Select the type as `Web app`, Execute as "Me", Who has access "Anyone" and then click "Deploy". You will get an URL. Open it in another tab. You should see the output.


### Rendering client-side UI using HTMLService
We can use [HTMLService](https://developers.google.com/apps-script/reference/html) to server html file to the client. Basically, we need to return a HTML file from `doGet` function. You can return a html file using [`createHtmlOutputFromFile(filename)`](https://developers.google.com/apps-script/reference/html/html-service#createhtmloutputfromfilefilename).

Let's try out an example. First, Add a new file (HTML). Let's name it `index`. Now, let's add some html.
```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
  </head>
  <body>
    <p>This is a cool todo app made using google app script.</p>
  </body>
</html>
```

Now, in return this file in the `doGet` function in `Code.gs`
```js
function doGet(e)
{
  return HtmlService.createHtmlOutputFromFile("index.html")
}
```
You can either use `index.html` or `index` as a filename. Google app script doesn't allow you to add more than one file with the same name, even if it is a script and HTML file. If you open the URL (from the test deployment), you should see this html file being served.


### Communicating with the server
There is a way to call server-side functions, from your client-side js or even html. This is the easiest way to talk to your server. You can use [Client-side API](https://developers.google.com/apps-script/guides/html/communication) to call the server-side API. Basically, you use `google.script.run.yourFunction()`, where `yourFunction()` is defined in the script file (server-side). You can pass most of the datatypes as an argument to the function, and the same will be available on the server. Similarly, `yourFunction()` can return values, which will be available to your client side.

Let's start with a simple example. The client-side sends the client's current date to the server, and the server logs it to the console. Note that Date datatype is not allowed as an argument, so we convert it to string.
In the server-side code `Code.gs`, add the `logUserDate` function.
```js
function logUserDate(date)
{
  Logger.log(`user_date : ${date}`);
}
```
Now we can call this `logUserDate` from client-side js. Modify `index.html`
```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
  </head>
  <body>
    <p>This is a cool todo app made using google app script.</p>
    <script>
      let userdate = new Date();
      google.script.run.logUserDate(userdate.toString());
    </script>
  </body>
</html>
```

You can now refresh the webpage URL. Go to the script editor, and open the `Executions` tab. All the server logs will be displayed here. You can see that there are two execution logs, first for the `doGet` that returns the web page to the client, and then for the `logUserDate`, which is called from the client side js.
![Execution Logs](./.notes/execution-log.png)

How does it work, you might be wondering. Well, the utility, provided by [`google.script.run`](https://developers.google.com/apps-script/guides/html/reference/run), does the HTTP call for you. It will send a [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) request to the server. The server parses the request, calls the correct function and returns the value as a response to the client. This is called [Remote procedure call](https://en.wikipedia.org/wiki/Remote_procedure_call). If you look at your browser network tab, you will see a [POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) request sent to the server. The request data is a form data in this format `request	'["logUserDate","[\\"Your date string"]",null,[0],null,null,1,0]'`.

You can use the [Client-side API](https://developers.google.com/apps-script/guides/html/communication) to get back the data from the server using [`withSuccessHandler(function)`](https://developers.google.com/apps-script/guides/html/reference/run#withsuccesshandlerfunction) callback. Similarly, you can use [`withFailureHandler(function)`](https://developers.google.com/apps-script/guides/html/reference/run#withsuccesshandlerfunction) callback to handle the errors while making the request.

Let's see an example. Say you have a server function `getSum(a,b)` that calculates the sum of two numbers `a` and `b`.
```js
const getSum = (a,b) => {
  return a+b;
}
```
On the client side js, we can get back the results using the [`withSuccessHandler(function)`](https://developers.google.com/apps-script/guides/html/reference/run#withsuccesshandlerfunction) callback. The parameter passed to the callback function is the return value from the server (the sum in this case).
```js
<script>
const a = 3;
const b = 4;

const printSum = (result) => {
  console.log(`The sum of ${a},${b} is ${result}`);
};

google.script.run.withSuccessHandler(printSum).getSum(a,b);
</script>
```

### Templated HTML: Dynamic HTML rendering
[Templated HTML](https://developers.google.com/apps-script/guides/html/templates#index.html_2) allows you to render dynamic html page. It allows you to dynamically add sections to your html, before sending it to the client. If you are familiar with other [template engines](https://en.wikipedia.org/wiki/Template_processor) like [jinja](https://jinja.palletsprojects.com/en/3.1.x/), [EJS](https://ejs.co/), etc, it is similar to those. You can embed code inside your HTML document, and the server renders those to get a complete HTML, before sending to the client. 
To add dynamic logic to your HTML you can use these syntaxes:
* To render unescaped output.
```
<? your logic ?>
eg: <? data.user_script ?>
```
Use it if you trust the source the data is coming from, and the data to be rendered is some script. In the above example, data.user_script is rendered by the server and replaced with a js code.

* To render escaped output.
```
<?= your logic ?>
eg: <p><?= data.user_name ?> logged in</p>
```
Use this if the data source is not trusted, or anytime you don't need to dynamically add some script. Escaped output means the output is the literal string as provided in the input. It is achieved by adding [escape characters](https://en.wikipedia.org/wiki/Escape_character) instead of evaluating them.

To create a templated HTML, you can use [`HTMLService.createTemplateFromFile(filename)`](https://developers.google.com/apps-script/reference/html/html-service#createtemplatefromfilefilename). This will return a template file from the file you have given. To render it (evaluate the template code), use [`evaluate()`](https://developers.google.com/apps-script/reference/html/html-template#evaluate). You can also pass data to the template, by setting the template HTML's `data` variable.

Let's try an example. We will show the visitor count to the user.
Let's start with the template html `index.html`
```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
  </head>
  <body>
    <p>You are the <?= data.visitor_count?> visitor</p>
  </body>
</html>
```
Here, `data.visitor_count` will return the visitor count. 

For the server side, we will keep track of the visitor in a global variable, and return that in the template. Please note that global variables are not persistent by default, meaning each time you run the script, the global variables will be allocated again and they will get initialized again. So, you can't simply keep track of the visitors using global count. We will be using [Properties Service](https://developers.google.com/apps-script/guides/properties) to create a "persistent" property. Let's modify `code.gs`.
```js
function doGet(e)
{
  let scriptProperties = PropertiesService.getScriptProperties();
  if(!scriptProperties.getProperty('visitor_count'))
  {
    //initialize the visitor_count
    scriptProperties.setProperty('visitor_count', 0);
  }

  //increament the visitor_count for each user
  let visitor_count = scriptProperties.getProperty('visitor_count');
  visitor_count++;
  scriptProperties.setProperty('visitor_count', visitor_count);

  //Render the htl template by passing the visitor_count data
  let template = HtmlService.createTemplateFromFile("index.html");
  template.data = {
    visitor_count
  };
  visitor_count += 1;
  const rendered_html = template.evaluate();
  return rendered_html;
}
```
If you open the test deployment URL, each time you refresh the browser, you should see the count increase.
![Visitor Count Example](./.notes/visitor-count-example.png)

### Refactoring code into html, css, js and gs files
Now that we know the basics of how google app script works, we can start coding our application. But, let's see how to [structure](https://developers.google.com/apps-script/guides/html/best-practices) our code first. As you might have seen, you can only add a "Script" or "HTML" file in your script. However, you can put your html, css and js into multiple HTML files and then render it as a single file to the user. You can also have multiple gs files.
Let's see how you can refactor your frontend html, css and js. You create a template html, call the server-side function to "include" other files and render that html template to get the entire page.
You can refer to [this for the complete source code(https://github.com/sauravshah31/technical-blogs/tree/f96608505219de29cbdb080f0b559756f89d396e/google-apps-script-1/src) and have a look at [this for the final web app](https://script.google.com/macros/s/AKfycbzKyjNM5Elde7s_nTBPm90r8B-EeOim3rCD_GIggv1n275xOmT-JWEj2JsliB3uwbVC/exec) for the complete source code. `index.html` is a template HTML that "includes" other html files.
```html
<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
    <?!= include('stylesheet'); ?>
  </head>
  <body>
    <div id="root">
      <?!= include('header'); ?>
      <div class="line"></div>
      <?!= include('body'); ?>
      <div class="line"></div>
      <?!= include('footer'); ?>
    <div>
      <?!= include('javascript'); ?>
  </body>
</html>
```
On the server side, we have a function `include(filename)` that returns html output from the file. `index.html` template code is calling this server-side function.
```js
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}
```

