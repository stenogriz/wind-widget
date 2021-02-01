// wind-widget
// Shows current wind in Mejhvodnoe and Sevastopol kite spots.
// Data are actual weather station data (working only during summer season)
// https://scriptable.app/ required to run the script on iOS/iPadOS
// Thanks to authors of 'Read MacStories' script, which inspired me with its simplicity.
// Data sources:
// wind-extreme.com for Mejvodnoe
// surfradar.ru for Sevastopol

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

let mjvd = await getMjvdWind()
let sev = await getSevData()

if (config.runsInWidget) {
  // Tell the widget on the Home Screen to show our ListWidget instance.
  let widget = await createWidget(mjvd, sev)
  Script.setWidget(widget)
} else if (config.runsWithSiri) {
  // Present a table with a subset of the news.
  //let firstItems = items.slice(0, 5)
  //let table = createTable(firstItems)
  //await QuickLook.present(table)
} else {
  // Present the full list of news.
  let table = createTable(mjvd, sev)
  await QuickLook.present(table)
}

Script.complete()

function createTable(items, items_sev) {
  let table = new UITable()
  let row = new UITableRow()
  let dt = row.addText("Mejvodnoe")
  table.addRow(row)
  for (i=0; i<items["Vmid"].length; i++) {
    row = new UITableRow()
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
  row = new UITableRow()
  dt = row.addText("Sevastopol")
  table.addRow(row)
  console.log(items_sev["forecast"]["tabular"]["time"].length)
  for (i=items_sev["forecast"]["tabular"]["time"].length-1; i>=0; i--){
    row = new UITableRow()
     dt = row.addText(items_sev["forecast"]["tabular"]["time"][i]["@attributes"]["from"].replace("T", " "))
    let Vgust = row.addText(""+items_sev["forecast"]["tabular"]["time"][i]["windGust"]["@attributes"]["mps"])
    let Vspd = row.addText(""+items_sev["forecast"]["tabular"]["time"][i]["windSpeed"]["@attributes"]["mps"])
    dt.widthWeight = 15
    Vspd.widthWeight = 4
    Vgust.widthWeight = 4
    row.height = 20
    row.cellSpacing = 10
    row.dismissOnSelect = false
    table.addRow(row)
  }
  return table
}

async function createWidget(items, items_sev) {
  // let wind = items["Vmid"][items["Vmid"].length-1]
  let average_wind = items_sev["forecast"]["tabular"]["time"][items_sev["forecast"]["tabular"]["time"].length-1]["windSpeed"]["@attributes"]["mps"]
  let windText = ""
  let widget = new ListWidget()
  // Add spacer above content to center it vertically.
  widget.addSpacer()
  if (args.widgetParameter == "mjvd") {let spot = widget.addText("Межводное")}
else if (args.widgetParameter == "sev") {let spot = widget.addText("Севастополь")} else {let spot = widget.addText("Севастополь")}
  // Show article headline.
  let titleElement = widget.addText(average_wind.toFixed(1)+" m/s")
  if (average_wind < 6){
    widget.backgroundColor = new Color("#3c7db5")
  } else if (average_wind > 9){
    widget.backgroundColor = new Color("#b0483a")
  } else {
    widget.backgroundColor = new Color("#59b03a")
  }
  let kiteText = Math.round(min_size(average_wind)) + " | " + Math.round(ideal_size(average_wind)) + " | " + Math.round(max_size(average_wind))
  let kiteElement = widget.addText(kiteText)
//   spot.centerAlignText()
  titleElement.font = Font.boldSystemFont(24)
  titleElement.textColor = Color.white()
  titleElement.minimumScaleFactor = 0.75
  titleElement.centerAlignText()
  kiteElement.textColor = Color.white()
  kiteElement.centerAlignText()
  // Add spacing below headline.
  widget.addSpacer()
  return widget
}

async function getMjvdWind(){
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


async function getSevData(){
  let url = "http://surfradar.ru/weather/default/history?history=24" // possible hisotry param values: 24, 72 and 168 (hours)
  let req = new Request(url)
  return await req.loadJSON()
}
