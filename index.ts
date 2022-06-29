import express from "express";

const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//CROS対応（というか完全無防備：本番環境ではだめ絶対）
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
  }
);

app.listen(3000, () => {
  console.log("Start on port 3000.");
});

//一覧取得
app.get("/api", async (req: express.Request, res: express.Response) => {
  const pw = require('playwright');
  let url = 'none';

  await (async () => {
    const browser = await pw.webkit.launch();
    const page = await browser.newPage({ width: 500, height: 500 });
    const html = `
    <!doctype html>
    <head><script src="https://cdn.plot.ly/plotly-latest.min.js"></script></head>
    <body>
    <div id="plot" style="width:500px;height:500px;"></div>
    <div id="export"></div>
    <script>
      var d3 = Plotly.d3;
      var img_png = d3.select('#png-export');
      var mock = {
          "data": [
          {"mode": "markers",
            "y": [10, 15, 11, 17],
            "x": [1, 2, 3, 4],
            "type": "scatter"},
          {"mode": "lines",
            "y": [16, 5, 11, 10],
            "x": [2, 3, 4, 5],
            "type": "scatter"
          }],
        "layout": {
          "height": 400,
          "width": 500,
          "title": "Line and Scatter Plot"
        }
      }
      Plotly.plot(
        'plot',
        mock.data,
        mock.layout
      ).then(function(gd){
        Plotly.toImage(gd,{height:400,width:500})
          .then(function(url){
            document.getElementById("export").innerHTML=url;
          })
      })
    </script>
    </body></html>`;

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const _sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await _sleep(2000);

    url = await page.evaluate(() => {
      const el = document.getElementById('export')
      if (el !== null) {
        return el.innerHTML;
      }
      return 'not found';
    })
    await browser.close();
  })();

  res.send(JSON.stringify(url));
});
