let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/*
Returns month name from month number
*/
const _getMonthName = (month) => 
{
  if(month >=1 && month <= 12)
  {
    return months[month - 1];
  }
  return "";
};

/*
Returns Folder name in the format month-year from the
date given in the format yyyy-mm-dd
*/
const _getFolderNameFromDate = (date) =>
{
  date = date.split("-");
  const month = parseInt(date[1]);
  let month_name = _getMonthName(month);
  return `${month_name}-${date[0]}`;
}

/*
Validates the input date
*/
const _validateInputDate = (date) => {
  if(date.constructor !== String)
  {
    return false;
  }
  else if(date.length != "10")
  {
    return false;
  }
  else if(date.match("[0-9]{4}-[0-9]{2}-[0-9]{2}") === null)
  {
    return false;
  }
  return true;
}

/*
Validates the input task description
*/
const _validateInputTaskDesc = (desc) => {
  if(desc.constructor !== String)
  {
    return false;
  }
  else if(desc.length > 500)
  {
    return false;
  }
  return true;
}

/*
Validates the input id
*/
const _validateInputId = (desc) => {
  if(desc.constructor !== String || desc.length > 128)
  {
    return false;
  }
  return true;
}

/*
Returns the month end date for the previous month
*/
const _getPreviousMonthEndDate = (date) => 
{
  let currDate = date;
  let [year, month, day] = date.split("-");
  year = parseInt(year);
  month = parseInt(month);
  day = parseInt(day);
  while(true)
  {
    if(parseInt(currDate.split("-")[1]) !== month)
    {
      break;
    }
    currDate = (new Date((new Date(currDate)) - 24 * 60 * 60 * 1000)).toISOString().substring(0,10);
  }
  return currDate;
}

/*
Compares date1 and date2
Return -1 if date1 < date2, 0 if date1 = date2 and 1 if date1 > date2
*/
const _compareDate = (date1, date2) =>
{
  let parsedDate1 = new Date(date1);
  let parsedDate2 = new Date(date2);

  if(parsedDate1 == parsedDate2)
    return 0;
  else if(parsedDate1 < parsedDate2)
    return -1;
  else
    return 1;
}

/*
Checks if date is in between start_date and end_date (both inclusive)
Returns true or false
*/
const _dateInRange = (start_date, end_date, date) =>
{
  let cmp1 = _compareDate(start_date, date);
  let cmp2 = _compareDate(end_date, date);
  if(cmp1 >=0 && cmp2 <= 0)
    return true;
  return false;
}

/*
Returns range of dates between start_date and end_date
*/
const _getDaysFromRange = (start_date, end_date) => {
  let parsedDate1 = new Date(start_date);
  let parsedDate2 = new Date(end_date);

  let dates = []
  while(parsedDate1 < parsedDate2)
  {
    dates.push(parsedDate1.toISOString().substring(0,10));
    parsedDate1.setDate(parsedDate1.getDate() + 1);
  }
  return dates;
}
