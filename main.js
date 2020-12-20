// http://www.wind-extreme.com/wind-mezhvodnoe/
// http://surfradar.ru


mejvodnoe = await mjvd_wind()

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
  let item = items["Vmid"][items["Vmid"].length-1]
  let gradient = new LinearGradient()
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color("#b00a0fe6"),
    new Color("#b00a0fb3")
  ]
  let widget = new ListWidget()
  widget.backgroundColor = new Color("#b00a0f")
  widget.backgroundGradient = gradient
  // Add spacer above content to center it vertically.
  widget.addSpacer()
  // Show article headline.
  let titleElement = widget.addText(item)
  titleElement.font = Font.boldSystemFont(16)
  titleElement.textColor = Color.white()
  titleElement.minimumScaleFactor = 0.75
  // Add spacing below headline.
  return widget
}


async function mjvd_wind(){
  let url = "http://www.wind-extreme.com/wind-mezhvodnoe/"
  let wv = new WebView()
  await wv.loadURL(url)
  let req = `
function getShit(className, start, step){
  a = [];
elements = document.getElementsByClassName(className);
for (let i = start; i < elements.length; i=i+step) {
        a.push(elements[i].innerHTML); 
      }
return a;}

data = {};
data["Vmax"] = getShit("style111", 1, 1);
data["Vmid"] = getShit("style222", 1, 1);
data["Vmin"] = getShit("style333", 1, 1);
data["time"] = getShit("style71", 10, 6);
data["date"] = getShit("style71", 9, 6);
data;
`
  let table = await wv.evaluateJavaScript(req)
  return table
}
