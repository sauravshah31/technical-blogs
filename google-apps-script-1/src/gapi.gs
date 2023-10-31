/*
Class gAPI exposes methods to interact eith google services
*/
class gAPI {
  constructor()
  {
    this.rootFolder = {id:"", object:null}; //Keeps track of apps root folder
    this.monthFolder = {};                  //Kepps track of month folder
    this.todoSheet = {};                    //Keeps track of spreadsheet
  }

  /*
  Creates and set's the app's root folder
  This method is synchronized using LockService 
  to ensure only one process can call it at a time 
  (prevents calling this functions twice at the same time, 
  which would create the root folder twice)
  */
  setRootAppFolder (name) {
    let lock = LockService.getScriptLock();
    let status = lock.tryLock(5000); //Acquire the lock (only one process can get it at a time)

    let folder = DriveApp.getFoldersByName(name);
    if(folder.hasNext() === false)
    {
      //create folder
      folder = DriveApp.createFolder(name);
    }
    else
    {
      //folder already exists
      folder = folder.next();
    }
    this.rootFolder.id = folder.getId();
    this.rootFolder.object = folder;
    if(status)
    {
      lock.releaseLock(); //release the lock so that other process can acquire it
    }
  }

  /*
  Creates and sets the month folder from the date passed
  This method is synchronized using LockService 
  to ensure only one process can call it at a time 
  (prevents calling this functions twice at the same time, 
  which would create the month folder twice)
  */
  setMonthFolder (date) {
    let lock = LockService.getScriptLock();
    let status = lock.tryLock(5000);  //Acquire the lock (only one process can get it at a time)

    if(this.rootFolder.id === "")
    {
      //app's root folder should be created first
      this.setRootAppFolder(CONSTANTS.ROOT_FOLDER_NAME);
    }
    let folder_name = _getFolderNameFromDate(date);
    let folder = this.rootFolder.object.getFoldersByName(folder_name);
    if(folder.hasNext() === false)
    {
      //create folder
      folder = this.rootFolder.object.createFolder(folder_name);
    }
    else
    {
      //folder already exists
      folder = folder.next();
    }

    this.monthFolder[folder_name] = {
      id: folder.getId(),
      object: folder
    };
    if(status)
    {
      lock.releaseLock(); //release the lock so that other process can acquire it
    }
  }

  /*
  Creates and sets the todo spreadsheet from the date passed
  This method is synchronized using LockService 
  to ensure only one process can call it at a time 
  (prevents calling this functions twice at the same time, 
  which would create the spreadsheet twice)
  */
  setTodoSheet(date) {
    let lock = LockService.getScriptLock();
    let status = lock.tryLock(5000); //Acquire the lock (only one process can get it at a time)

    let folder_name = _getFolderNameFromDate(date);
    let file_name = `${date}-${CONSTANTS.TODO_SHEET_SUFFIX}`;
    if(folder_name in this.monthFolder === false)
    {
      //months folder for this spreadsheet should be created first
      this.setMonthFolder(date);
    }

    let file = this.monthFolder[folder_name].object.getFilesByName(file_name);
    let append_header = false;
    if(file.hasNext() === false)
    {
      //create file
      file = SpreadsheetApp.create(file_name);
      file = DriveApp.getFileById(file.getId()).moveTo(this.monthFolder[folder_name].object);
      append_header = true;
    }
    else
    {
      //file already exists
      file = file.next();
    }

    let spreadsheet = SpreadsheetApp.open(file);
    let sheet = spreadsheet.getSheets()[0];
    if(append_header)
    {
      sheet.appendRow(CONSTANTS.TASK_SHEET_HEADERS);
    }

    this.todoSheet[file_name] = {
      id : file.getId(),
      object : file,
      sheet : sheet
    }
    if(status)
    {
      lock.releaseLock(); //release the lock so that other process can acquire it
    }
  }

  /*
  Checks if sheet exists
  */
  checkSheetExists(date) {
    let folder_name = _getFolderNameFromDate(date);
    let file_name = `${date}-${CONSTANTS.TODO_SHEET_SUFFIX}`;
    if(this.rootFolder.id === "")
    {
      this.setRootAppFolder(CONSTANTS.ROOT_FOLDER_NAME);
    }

    let folder = this.rootFolder.object.getFoldersByName(folder_name);
    if(folder.hasNext())
    {
      folder = folder.next();
      let file = folder.getFilesByName(file_name);
      if(file.hasNext())
      {
        return true;
      }
    }
    return false;
  }

  /*
  Returns tasks for the day
  */
  getTasks(date) {
    if(!this.checkSheetExists(date))
    {
      return [];
    }
    let file_name = `${date}-${CONSTANTS.TODO_SHEET_SUFFIX}`;
    if((file_name in this.todoSheet) === false)
    {
      this.setTodoSheet(date);
    }
    let rows = this.todoSheet[file_name].sheet.getDataRange().getValues(); //read the sheet
    rows = rows.slice(1); //ignore the first row, which is header
    return rows;
  }

  /*
  Returns download link for the spreadsheet for the day
  */
  getSheetLink(date) {
    if(!this.checkSheetExists(date))
    {
      return null;
    }
    let download_link = null;
    let file_name = `${date}-${CONSTANTS.TODO_SHEET_SUFFIX}`;
    if((file_name in this.todoSheet) === false)
    {
      this.setTodoSheet(date);
    }
    download_link = `https://docs.google.com/spreadsheets/d/${this.todoSheet[file_name].object.getId()}/view`; //Construct the link from sheet's id
    return download_link;
  }

  /*
  Adds a task and returns the added row
  */
  addTask(date, taskDescription) {
    let id = Utilities.getUuid();
    let today = new Date();
    let row = [id, taskDescription, false, today.toUTCString()];
    let file_name = `${date}-${CONSTANTS.TODO_SHEET_SUFFIX}`;
    if((file_name in this.todoSheet) === false)
    {
      this.setTodoSheet(date);
    }
    this.todoSheet[file_name].sheet.appendRow(row); //append the task
    return row;
  }

  /*
  Update a task and returns the updated id
  */
  updateTask(date, task_id, updateValues)
  {
    let file_name = `${date}-${CONSTANTS.TODO_SHEET_SUFFIX}`;
    if((file_name in this.todoSheet) === false)
    {
      this.setTodoSheet(date);
    }

    let tasks = this.todoSheet[file_name].sheet.getDataRange().getValues();
    let updateRowIdx = tasks.findIndex(row => row[CONSTANTS.TASK_ID_IDX] == task_id); //Get the index for the task with id = task_id
    if(updateRowIdx === -1)
    {
      return "";
    }
    let updatedRow = [...tasks[updateRowIdx]]; //original row
    //update the row
    for(let key in updateValues)
    {
      if(key === CONSTANTS.TASK_SHEET_HEADERS[CONSTANTS.TASK_DESC_IDX])
      {
        updatedRow[CONSTANTS.TASK_DESC_IDX] = updateValues[key];
      }
      else if(key === CONSTANTS.TASK_SHEET_HEADERS[CONSTANTS.TASK_COMPLETED_IDX])
      {
        updatedRow[CONSTANTS.TASK_COMPLETED_IDX] = updateValues[key];
      }
    }
    let sheetRowRange = this.todoSheet[file_name].sheet.getRange(updateRowIdx + 1, 1, 1, CONSTANTS.TASK_SHEET_HEADERS.length); //get the range of cell for the index
    sheetRowRange.setValues([updatedRow]);  //update the range
    return updatedRow[CONSTANTS.TASK_ID_IDX];
  }
};


let GAPI = new gAPI();

/*
Test cases
*/
const _testGAPI = () => {
  let testDate = "2023-10-12";
  GAPI.addTask(testDate, "This is some task added using gAPI");
  GAPI.addTask(testDate, "This is task 2 added using gAPI");
  GAPI.addTask(testDate, "This is task 3 added using gAPI");
  GAPI.addTask(testDate, "This is task 4 added using gAPI");

  let tasks = GAPI.getTasks(testDate);
  const updateValues = {};
  updateValues[CONSTANTS.TASK_SHEET_HEADERS[CONSTANTS.TASK_COMPLETED_IDX]] = true;
  GAPI.updateTask(testDate, tasks[0][CONSTANTS.TASK_ID_IDX], updateValues);
  GAPI.updateTask(testDate, tasks[2][CONSTANTS.TASK_ID_IDX], updateValues);
}