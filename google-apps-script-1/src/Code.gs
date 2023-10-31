/* 
Returns HTML output from a file
*/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

/*
GET endpoint, returns the client side web app
*/
function doGet(e)
{
  //install the trigger to send monthly report
  _installMonthlyReportTrigger();
  //Render the html template by passing the visitor_count data
  let template = HtmlService.createTemplateFromFile("index.html");
  const rendered_html = template.evaluate();
  rendered_html.setTitle("CoolTodoApp : By Saurav Shah")
  rendered_html.addMetaTag('viewport', 'width=device-width, initial-scale=1');
  rendered_html.setFaviconUrl("https://drive.google.com/uc?id=1twzpy63EbJV4b9U91UtgSZw7Zi8Ou5Lr&export=download&format=png");
  return rendered_html;
}

/*
Adds tasks to the todo list
*/
const AddTask = (date, taskDescription) => {
  if(!_validateInputDate(date) || !_validateInputTaskDesc(taskDescription))
  {
    throw new TypeError("Invalid request"); 
  }
  let row = GAPI.addTask(date, taskDescription);
  if(!row)
  {
    throw new Error("something went wrong");
  }
  return row;
}

/*
Marks a task as complete
*/
const UpdateTaskCompleted = (date, task_id) => {
  if(!_validateInputDate(date) || !_validateInputId(task_id))
  {
    throw new TypeError("Invalid request"); 
  }
  let updateValue = {};
  updateValue[CONSTANTS.TASK_SHEET_HEADERS[CONSTANTS.TASK_COMPLETED_IDX]] = true;
  let id = GAPI.updateTask(date, task_id, updateValue);
  if(id === null)
  {
    throw new Error("something went wrong");
  }
  return id;
}

/*
Marks a task as pending
*/
const UpdateTaskPending = (date, task_id) => {
  if(!_validateInputDate(date) || !_validateInputId(task_id))
  {
    throw new TypeError("Invalid request"); 
  }
  let updateValue = {};
  updateValue[CONSTANTS.TASK_SHEET_HEADERS[CONSTANTS.TASK_COMPLETED_IDX]] = false;
  let id = GAPI.updateTask(date, task_id, updateValue);
  if(id === null)
  {
    throw new Error("something went wrong");
  }
  return id;
}

/*
Returns lists of completed tasks
*/
const GetCompletedTasks = (date) => {
  if(!_validateInputDate(date))
  {
    throw new TypeError("Invalid request");
  }
  let tasks = GAPI.getTasks(date);
  let completedTasks = tasks.filter(row => row[CONSTANTS.TASK_COMPLETED_IDX] == true);
  return completedTasks;
}

/*
Returns lists of 
*/
const GetPendingTasks = (date) => {
  if(!_validateInputDate(date))
  {
    throw new TypeError("Invalid request");
  }
  let tasks = GAPI.getTasks(date);
  let pendingTasks = tasks.filter(row => row[CONSTANTS.TASK_COMPLETED_IDX] == false);
  return pendingTasks;
}

/*
Test cases
*/
const _testendpoints = () => {
  let today = "2023-10-12";
  console.log(GetCompletedTasks(today));
  console.log(GetPendingTasks(today));
}
