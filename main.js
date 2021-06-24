// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: umbrella-beach;
// wind-widget
// Shows current wind in Mejhvodnoe and Sevastopol kite spots.
// Data are actual weather station data (working only during summer season)
// https://scriptable.app/ required to run the script on iOS/iPadOS
// Thanks to authors of 'Read MacStories' script, which inspired me with its simplicity.
// Data sources:
// wind-extreme.com for Mejvodnoe
// surfradar.ru for Sevastopol
// Possible widget arguments:
// 'mjvd' for Mejvodnoe
// 'sev' for Sevastopol (default)


// configuration
const user_weight = 88 // kg

// maximum kite size
const max_kite = 21 // m2

// some coefficients
const ms2kt = 1.94384

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

const fm = FileManager.local()
const docPath = fm.joinPath(fm.documentsDirectory(), '/kite/')
fm.createDirectory(docPath, true)

//let mjvd = await getMjvdWind()
let sev = await getSevData()

if (config.runsInWidget) {
  // Tell the widget on the Home Screen to show our ListWidget instance.
  let widget = await createWidget(sev)
  Script.setWidget(widget)
} else if (config.runsWithSiri) {
// none yet
} else {
  // Present the full list of news.
  let table = createTable(sev)
  await QuickLook.present(table)
}

Script.complete()

function createTable(items_sev) {
  let table = new UITable()
  try{
  row = new UITableRow()
  dt = row.addText("Sevastopol")
  table.addRow(row)
  console.log(items_sev["forecast"]["tabular"]["time"].length)
  for (i=items_sev["forecast"]["tabular"]["time"].length-1; i>=0; i--){
    row = new UITableRow()
let dt = row.addText(items_sev["forecast"]["tabular"]["time"][i]["@attributes"]["from"].replace("T", " "))
let Wdir = row.addText(""+items_sev["forecast"]["tabular"]["time"][i]["windDirection"]["@attributes"]["code"])
let Vgust = row.addText(""+items_sev["forecast"]["tabular"]["time"][i]["windGust"]["@attributes"]["mps"])
let Vspd = row.addText(""+items_sev["forecast"]["tabular"]["time"][i]["windSpeed"]["@attributes"]["mps"])
    dt.widthWeight = 14
    Wdir.widthWeight = 4
    Vspd.widthWeight = 4
    Vgust.widthWeight = 4
    row.height = 20
    row.cellSpacing = 10
    row.dismissOnSelect = false
    table.addRow(row)
  }} catch {console.log("error")}
  return table
}

async function createWidget(items_sev) {
  // let wind = items["Vmid"][items["Vmid"].length-1]
  let indx = items_sev["forecast"]["tabular"]["time"].length-1
  let average_wind = items_sev["forecast"]["tabular"]["time"][indx]["windSpeed"]["@attributes"]["mps"]
  let windText = ""
  let widget = new ListWidget()
  // Add spacer above content to center it vertically.
  widget.addSpacer()
  let spot = widget.addText("Севастополь")
  // Show article headline.
  let titleElement = widget.addText(average_wind.toFixed(1)+" m/s")
  if (average_wind < 5.8){
    widget.backgroundColor = new Color("#3c7db5")
  } else if (average_wind > 9){
    widget.backgroundColor = new Color("#b0483a")
  } else {
    widget.backgroundColor = new Color("#59b03a")
  }
  let adtnl = widget.addText(items_sev["forecast"]["tabular"]["time"][indx]["windDirection"]["@attributes"]["code"]+", "+items_sev["forecast"]["tabular"]["time"][indx]["windGust"]["@attributes"]["mps"]+" m/s")
  
  let minimum = min_size(average_wind)>max_kite?"-":Math.round(min_size(average_wind))
  let ideal = ideal_size(average_wind)>max_kite?"-":Math.round(ideal_size(average_wind))
  let maximum = max_size(average_wind)>max_kite?"-":Math.round(max_size(average_wind))
  let kiteText = minimum + " | " + ideal + " | " + maximum
  let kiteElement = widget.addText(kiteText)
//   let lastUpdate = widget.addText(items_sev["forecast"]["tabular"]["time"][indx]["@attributes"]["from"].replace("T", " "))
  spot.centerAlignText()
  spot.font = Font.systemFont(14)
  adtnl.font = Font.systemFont(14)
//   lastUpdate.font = Font.systemFont(14)
//   lastUpdate.centerAlignText()
//   kiteElement.font = Font.systemFont(14)
  titleElement.font = Font.boldSystemFont(24)
  titleElement.textColor = Color.white()
  titleElement.minimumScaleFactor = 0.75
  titleElement.centerAlignText()
  adtnl.centerAlignText()
  kiteElement.textColor = Color.white()
  kiteElement.centerAlignText()
  // Add spacing below headline.
  widget.addSpacer()
  return widget
}

async function getMjvdWind(){
  let url = "https://www.wind-extreme.com/meteo/wind-mezhvodnoe/index.php"
//   let url = "http://www.wind-extreme.com/wind-mezhvodnoe/"
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

async function getSevData(){
  let url = "http://surfradar.ru/weather/default/history?history=24" // possible history param values: 24, 72 and 168 (hours)
  const scriptPath = fm.joinPath(docPath, "surfpoint.json")
let content = {}
  try {
    let req = new Request(url)
    content = await req.loadJSON()
  } catch (error) {
    console.log("error")
    if (fm.fileExists(scriptPath)){
      try {
        content = JSON.parse(fm.readString(scriptPath))} catch (error) {
  console.log("error")
}
    }
  }
  fm.writeString(scriptPath, JSON.stringify(content))
  return content
}
