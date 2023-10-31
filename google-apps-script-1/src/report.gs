/*
Returns summary of tasks between start_date and end_date
*/
const _getTasksSummary = (start_date, end_date) => {
  //[Date, Completed, Pending, Total, Link]
  let days = _getDaysFromRange(start_date, end_date);
  let tasksSummary = [];
  for(let day of days)
  {
    let curr_tasks = GAPI.getTasks(day);
    if(curr_tasks.length === 0)
      continue;
    let sheetLink = GAPI.getSheetLink(day);
    let completed_tasks = curr_tasks.filter(row => row[CONSTANTS.TASK_COMPLETED_IDX] === true);
    let pending_tasks = curr_tasks.filter(row => row[CONSTANTS.TASK_COMPLETED_IDX] === false);
    let ncompletedTasks = completed_tasks.length;
    let ntasksPending = pending_tasks.length;
    let totalTasks = curr_tasks.length;
    tasksSummary.push([day, ncompletedTasks, ntasksPending, totalTasks, sheetLink]);
  }
  return tasksSummary;
}

/*
Generates tasks chart
*/
const _generateTasksChart = (nTasksCompleted, nTasksPending) => {
  //Prepare data to create data table
  let data = Charts.newDataTable()
                .addColumn(Charts.ColumnType.STRING, "task_type") //add a column to describe type of task
                .addColumn(Charts.ColumnType.NUMBER, "value"); //add a column to describe value for that task type
  //add rows to the data table for completed and pending tasks
  data.addRow(["completed", nTasksCompleted]);
  data.addRow(["pending", nTasksPending]);
  //Build te data table
  let dataTable = data.build();

  //create a new chart
  let chartBuilder = Charts.newPieChart()
                      .setDataTable(dataTable)  //set the data source
                      .setDimensions(675,435)   //set the dimension
                      .set3D()                  //set 3D option
                      .setOption('chartArea',{left:10,top:10,width:`${675 - 20}`,height:`${435 - 20}`}) //add 10px padding on all side
                      .setOption('legend', {alignment:'center', position:'labeled'}) //set label option
                      .setOption('pieSliceText', 'none')  //don't display any content in the slice
  let chart = chartBuilder.build(); //build the chart with the given options
  let blob = chart.getBlob(); //get the Blob for the chart
  return blob;
}

/*
Returns report data for tasks between start_date and end_date
*/
const _getReportData = (start_date, end_date) => {
  //[Date, Completed, Pending, Total, Link]
  const DATE_IDX = 0, COMPLETED_IDX = 1, PENDING_IDX = 2,TOTAL_IDX = 3, LINK_IDX = 4; 
  const tasksSummary = _getTasksSummary(start_date, end_date);
  let template_data = {
    start_date : start_date,
    end_date : end_date,
    total_task : 0,
    total_completed: 0,
    total_pending : 0,
    max_tasks_date : "",
    max_tasks_number : 0,
    max_completed_tasks_date : "",
    max_completed_tasks_number : 0,
    max_pending_tasks_date : "",
    max_pending_tasks_number : 0,
    min_tasks_date : "",
    min_tasks_number : 0,
    min_completed_tasks_date : "",
    min_completed_tasks_number : 0,
    min_pending_tasks_date : "",
    min_pending_tasks_number : "",
    average_task_completion_rate : "",
    tasks : [],
    todo_chart : "",
  };
  if(tasksSummary.length === 0)
    return template_data;
  template_data.max_tasks_number = tasksSummary[0][TOTAL_IDX];
  template_data.max_completed_tasks_number = tasksSummary[0][COMPLETED_IDX];
  template_data.max_pending_tasks_number = tasksSummary[0][PENDING_IDX];
  template_data.min_tasks_number = tasksSummary[0][TOTAL_IDX];
  template_data.min_completed_tasks_number = tasksSummary[0][COMPLETED_IDX];
  template_data.min_pending_tasks_number = tasksSummary[0][PENDING_IDX];

  for(let summary of tasksSummary)
  {
    template_data.total_completed += summary[1];
    template_data.total_pending += summary[2];
    template_data.total_task += summary[3];

    if(summary[TOTAL_IDX] >= template_data.max_tasks_number)
    {
      template_data.max_tasks_number = summary[TOTAL_IDX];
      template_data.max_tasks_date = summary[DATE_IDX];
    }

    if(summary[COMPLETED_IDX] >= template_data.max_completed_tasks_number)
    {
      template_data.max_completed_tasks_number = summary[COMPLETED_IDX];
      template_data.max_completed_tasks_date = summary[DATE_IDX];
    }

    if(summary[PENDING_IDX] >= template_data.max_pending_tasks_number)
    {
      template_data.max_pending_tasks_number = summary[PENDING_IDX];
      template_data.max_pending_tasks_date = summary[DATE_IDX];
    }

    if(summary[TOTAL_IDX] <= template_data.min_tasks_number)
    {
      template_data.min_tasks_number = summary[TOTAL_IDX];
      template_data.min_tasks_date = summary[DATE_IDX];
    }

    if(summary[COMPLETED_IDX] <= template_data.min_completed_tasks_number)
    {
      template_data.min_completed_tasks_number = summary[COMPLETED_IDX];
      template_data.min_completed_tasks_date = summary[DATE_IDX];
    }

    if(summary[PENDING_IDX] <= template_data.min_pending_tasks_number)
    {
      template_data.min_pending_tasks_number = summary[PENDING_IDX];
      template_data.min_pending_tasks_date = summary[DATE_IDX];
    }
  }
  template_data.average_task_completion_rate = `${Math.ceil(template_data.total_completed / template_data.total_task * 100)}%`;
  template_data.tasks = tasksSummary;
  return template_data;
}

/*
Sends monthly report to the user's email
*/
const _sendMonthlyEmailReport = (triggerDate) => {
  const endDate = _getPreviousMonthEndDate(triggerDate); //Get previous month's last date
  const startDate = endDate.substring(0, 8) + "01";
  let templateData = _getReportData(startDate, endDate);
  const subject = `Monthly task report for ${templateData.start_date} - ${templateData.end_date}`
  let todoChart = _generateTasksChart(templateData.total_completed, templateData.total_pending);
  todoChart.setName("Tasks summary chart");
  let pdfTemplate = HtmlService.createTemplateFromFile("report-template.html");
  let emailTemplate = HtmlService.createTemplateFromFile("report-template.html");
  templateData.todo_chart =  `data:image/png;base64,${Utilities.base64Encode(todoChart.getBytes())}`
  pdfTemplate.data = templateData;
  let pdfHtml = pdfTemplate.evaluate();
  pdfHtml.setTitle(subject)
  templateData.todo_chart =  `cid:todo_chart` //cid format inline image for email html body
  emailTemplate.data = templateData;
  let emailHtml = emailTemplate.evaluate();
  emailHtml.setTitle(subject);

  MailApp.sendEmail(Session.getActiveUser().getEmail(), subject, "",  //compose email to current user's email 
                        {
                          htmlBody : emailHtml.getContent(),  //adding email body from the html template
                          inlineImages : {"todo_chart":todoChart}, //adding cid format inline images
                          attachments:[pdfHtml.getBlob().getAs("application/pdf")], //add pdfReport as attachment
                        })
}

/*
Trigger callback
*/
const _sendMonthlyReportTriggerCallback = () => {
  let today = (new Date(Date.now() - tzoffset)).toISOString().substring(0,10);
  _sendMonthlyEmailReport(today);
}

/*
Installs monthly trigger
*/
const _installMonthlyReportTrigger = () => {
  let scriptProperties = PropertiesService.getScriptProperties();
  if(!scriptProperties.getProperty(CONSTANTS.MONTHLY_REPORT_TRIGGER_KEY))
  {
    //initialize the visitor_count
    scriptProperties.setProperty(CONSTANTS.MONTHLY_REPORT_TRIGGER_KEY, -1);
  }

  //get the trigger id stored
  let saved_trigger_id = scriptProperties.getProperty(CONSTANTS.MONTHLY_REPORT_TRIGGER_KEY);
  let trigger_installed = false;
  const allTriggers = ScriptApp.getProjectTriggers();
  //check if the trigger with the saved id is already present
  for (let index = 0; index < allTriggers.length; index++) {
    // If the current trigger is the correct one, delete it.
    if (allTriggers[index].getUniqueId() === saved_trigger_id) {
      trigger_installed = true;
      break;
    }
  }

  //install the trigger only once
  if(trigger_installed === false)
  {
    let triggerBuilder = ScriptApp.newTrigger('_sendMonthlyReportTriggerCallback') //create a trigger that calls _sendEmail
                        .timeBased()    //create a tiem based trigger builder
                        .onMonthDay(1)  //trigger on first of every month
                        .atHour(8)      //trigger on 8am - 9am
    let trigger = triggerBuilder.create(); //install the trigger
    //update the saved trigger id so that the trigger is not installed next time this function is called
    scriptProperties.setProperty(CONSTANTS.MONTHLY_REPORT_TRIGGER_KEY, trigger.getUniqueId());
  }
}

/*
Test cases
*/
const _testReportTemplate = (e) => {
  const ntasksCompleted = 10;
  const ntasksPending = 5;
  //Prepare data to create data table
  let data = Charts.newDataTable()
                .addColumn(Charts.ColumnType.STRING, "task_type") //add a column to describe type of task
                .addColumn(Charts.ColumnType.NUMBER, "value"); //add a column to describe value for that task type
  //add rows to the data table for completed and pending tasks
  data.addRow(["completed", ntasksCompleted]);
  data.addRow(["pending", ntasksPending]);
  //Build te data table
  let dataTable = data.build();

  //create a new chart
  let chartBuilder = Charts.newPieChart()
                      .setDataTable(dataTable)  //set the data source
                      .setDimensions(675,435)   //set the dimension
                      .set3D()                  //set 3D option
                      .setOption('chartArea',{left:10,top:10,width:`${675 - 20}`,height:`${435 - 20}`}) //add 10px padding on all side
                      .setOption('legend', {alignment:'center', position:'labeled'}) //set label option
                      .setOption('pieSliceText', 'none')  //don't display any content in the slice
  let chart = chartBuilder.build(); //build the chart with the given options
  let blob = chart.getBlob(); //get the Blob for the chart
  blob.setName("task-chart"); //give name to the blob
  let todoChart = blob;
  let template_data = {
    start_date : "2023-10-01",
    end_date : "2023-10-31",
    total_task : 15,
    total_completed: 10,
    total_pending : 5,
    max_tasks_date : "2023-10-01",
    max_tasks_number : "4",
    max_completed_tasks_date : "2023-10-01",
    max_completed_tasks_number : "3",
    max_pending_tasks_date : "2023-10-03",
    max_pending_tasks_number : "2",
    min_tasks_date : "2023-10-05",
    min_tasks_number : "1",
    min_completed_tasks_date : "2023-10-02",
    min_completed_tasks_number : "0",
    min_pending_tasks_date : "2023-10-05",
    min_pending_tasks_number : "0",
    average_task_completion_rate : "67%",
    tasks : [
      ["2023-10-01","3","1", "4", "https://example.com"],
      ["2023-10-02","0","1", "1", "https://example.com"],
      ["2023-10-03","1","2", "3", "https://example.com"],
      ["2023-10-04","1","1", "2", "https://example.com"],
      ["2023-10-05","1","0", "1", "https://example.com"],
      ["2023-10-06","1","0", "1", "https://example.com"],
      ["2023-10-07","1","0", "1", "https://example.com"],
      ["2023-10-08","1","0", "1", "https://example.com"],
      ["2023-10-09","1","0", "1", "https://example.com"],
    ],
    todo_chart : `data:image/png;base64,${Utilities.base64Encode(todoChart.getBytes())}` //encode into base64 from the blob bytes
  };
  //Render the htl template by passing the visitor_count data
  let report_templete = HtmlService.createTemplateFromFile("report-template.html");
  

  report_templete.data = template_data;
  const report_html = report_templete.evaluate();
  report_html.setTitle(`Task report for ${template_data.start_date} - ${template_data.end_date}`);
  const pdfReport = report_html.getBlob().getAs("application/pdf"); //convert the html to pdf
  let appFolder = DriveApp.getFoldersByName("CoolTodoApp").next();
  appFolder.createFile(pdfReport);
}