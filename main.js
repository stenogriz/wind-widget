// wind-widget
// Shows current wind on Mejhvodnoe and Sevastopol kite spots.
// Data are actual weather station data (working only during summer season)
// https://scriptable.app/ required to run the script on iOS/iPadOS
// Thanks to authors of 'Read MacStories' script, which inspired me with its simplicity.
// Data URLs:
// http://www.wind-extreme.com/wind-mezhvodnoe/
// http://surfradar.ru

// configuration
var user_weight = 88 // kg

// some coefficients
var ms2kt = 1.94384

// kite size calculations
var ideal_size = (wind_spd_ms) => {
  if (wind_spd_ms == 0){
    return 0
  } else {
    return (2.175*user_weight)/(wind_spd_ms*ms2kt)
  }
}
var min_size = (wind_spd_ms) => {
  return 0.75*ideal_size(wind_spd_ms)
}
var max_size = (wind_spd_ms) => {
  return 1.5*ideal_size(wind_spd_ms)
}

let mejvodnoe = await mjvd_wind()

if (config.runsInWidget) {
  // Tell the widget on the Home Screen to show our ListWidget instance.
  let widget = await createWidget(mejvodnoe)
  Script.setWidget(widget)
} else if (config.runsWithSiri) {
  // Present a table with a subset of the news.
  //let firstItems = items.slice(0, 5)
  //let table = createTable(firstItems)
  //await QuickLook.present(table)
} else {
  // Present the full list of news.
  let table = createTable(mejvodnoe)
  await QuickLook.present(table)
}

Script.complete()

function createTable(items) {
  let table = new UITable()
  for (i=0; i<items["Vmid"].length; i++) {
    let row = new UITableRow()
    let dt = row.addText(items["date"][i].replace("&nbsp;"," ").replace("&nbsp;"," "))
    let tm = row.addText(items["time"][i])
    let Vmin = row.addText(items["Vmin"][i])
    let Vmid = row.addText(items["Vmid"][i])
    let Vmax = row.addText(items["Vmax"][i])
    dt.widthWeight = 15
    tm.widthWeight = 6
    Vmin.widthWeight = 4
    Vmid.widthWeight = 4
    Vmax.widthWeight = 4
    row.height = 20
    row.cellSpacing = 10
    row.dismissOnSelect = false
    table.addRow(row)
  }
  return table
}

async function createWidget(items) {
  // let wind = items["Vmid"][items["Vmid"].length-1]
  let average_wind = 0
  for (i = items["Vmid"].length-1; i > items["Vmid"].length-6; i--){
    average_wind = average_wind + parseFloat(items["Vmid"][i])
    console.log(average_wind)
  }
  average_wind = average_wind / 5 // last 5 readings average
  let windText = ""
  let widget = new ListWidget()
  // Add spacer above content to center it vertically.
  widget.addSpacer()
  // Show article headline.
  let titleElement = widget.addText(average_wind.toString()+" m/s")
  if (average_wind < 6){
    windText = "Useless"
    widget.backgroundColor = new Color("#3c7db5")
  } else if (average_wind > 9){
    windText = "Dangerous"
    widget.backgroundColor = new Color("#b0483a")
  } else {
    windText = "Purrfect"
    widget.backgroundColor = new Color("#59b03a")
  }
  let kiteText = min_size(average_wind) + " | " + ideal_size(average_wind) + " | " + max_size(average_wind)
  let windElement = widget.addText(windText)
  let kiteElement = widget.addText(kiteText)
  titleElement.font = Font.boldSystemFont(24)
  titleElement.textColor = Color.white()
  titleElement.minimumScaleFactor = 0.75
  titleElement.centerAlignText()
  windElement.centerAlignText()
  kiteElement.textColor = Color.white()
  kiteElement.centerAlignText()
  // Add spacing below headline.
  widget.addSpacer()
  return widget
}

async function mjvd_wind(){
  let url = "http://www.wind-extreme.com/wind-mezhvodnoe/"
  let wv = new WebView()
  await wv.loadURL(url)
  let req = `
    function getData(className, start, step){
      a = [];
      elements = document.getElementsByClassName(className);
      for (let i = start; i < elements.length; i=i+step) {
        a.push(elements[i].innerHTML); 
      }
      return a;
    }

    data = {};
    data["Vmax"] = getData("style111", 1, 1);
    data["Vmid"] = getData("style222", 1, 1);
    data["Vmin"] = getData("style333", 1, 1);
    data["time"] = getData("style71", 10, 6);
    data["date"] = getData("style71", 9, 6);
    data["temp"] = getData("style71", 13, 6);
    data;
  `
  let table = await wv.evaluateJavaScript(req)
  return table
}
