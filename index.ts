import express from "express";
import pw from 'playwright';

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


function getHtml(value: number) {
  return `
    <!doctype html>
    <head><script src="https://cdn.plot.ly/plotly-latest.min.js"></script></head>
    <body>
    <div id="plot" />
    <div id="export" />
    <script>
      var d3 = Plotly.d3;
      var rt = [165600, 165900, 166200, 166500, 166800, 167100, 167400, 167700, 168000,168300, 168600, 168900, 169200, 169500, 169800, 170100, 170400, 170700,171000, 171300, 171600, 171900, 172200, 172500, 172800, 173100, 173400,173700, 174000, 174300, 174600, 174900, 175200, 175500, 175800, 176100,176400, 176700, 177000, 177300, 177600, 177900, 178200, 178500, 178800,179100, 179400, 179700, 180000, 180300, 180600, 180900, 181200, 181500,181800, 182100, 182400, 182700, 183000, 183300, 183600, 183900, 184200,184500, 184800, 185100, 185400, 185700, 186000, 186300, 186600, 186900,187200, 187500, 187800, 188100, 188400, 188700, 189000, 189300, 189600,189900, 190200, 190500, 190800, 191100, 191400, 191700, 192000, 192300,192600, 192900, 193200, 193500, 193800, 194100, 194400, 194700, 195000,195300, 195600, 195900, 196200, 196500, 196800, 197100, 197400, 197700,198000, 198300, 198600, 198900, 199200, 199500, 199800, 200100, 200400,200700, 201000, 201300, 201600, 201900, 202200, 202500, 202800, 203100,203400, 203700, 204000, 204300, 204600, 204900, 205200, 205500, 205800,206100, 206400, 206700, 207000, 207300, 207600, 207900, 208200, 208500,208800, 209100]
      var rtmin = rt.map((val) => val/60000);
      var int = [41, 40, 39, 38, 37, 36, 36, 36, 37, 37, 36, 35, 36, 38, 37, 36, 36, 38, 39,41, 43, 43, 42, 42, 41, 40, 39, 36, 34, 34, 37, 40, 40, 38, 53, 141, 328,470, 461, 430, 594, 1107, 3079, 9393, 23063, 40799, 45781, 50650, 60752,65063, 60799, 49781, 41650, 24752, 11428, 4766, 2211, 1387, 1091, 894, 726,632, 647, 618, 547, 562, 575, 511, 448, 389, 349, 326, 287, 297, 379, 418,427, 395, 373, 319, 256, 222, 198, 211, 237, 234, 179, 172, 188, 135, 98,82, 83, 88, 80, 62, 61, 63, 48, 38, 36, 37, 37, 36, 35, 35, 35, 35, 36, 39,41, 42, 40, 37, 39, 49, 70, 93, 77, 61, 50, 43, 39, 37, 38, 44, 51, 58, 104,194, 240, 225, 181, 128, 119, 160, 186, 226, 211, 141, 108, 85, 75, 40, 37,35]
      var intmod = int.map((val) => val * ${value});
      var mock = {
          "data": [{
            "mode": "lines",
            "y": intmod,
            "x": rtmin,
            "type": "scatter"
          }],
        "layout": {
          "height": 400,
          "width": 500,
          "title": "Chromatogram"
        }
      };

      Plotly.plot(
        'plot',
        mock.data,
        mock.layout
      ).then(function(gd){
        Plotly.toImage(gd,{height:400,width:500,format:"png"})
          .then(function(url){
            document.getElementById("export").innerHTML= url;
          })
        })
    </script>
    </body></html>`;
}


//一覧取得
app.get("/api", async (req: express.Request, res: express.Response) => {
  // 測定
  performance.mark('api_start');

  let url: string[] = [];
  let count = req.query.count ?? 0;

  await (async () => {
    const browser = await pw.webkit.launch();
    const page = await browser.newPage();

    for (let i = 0; i < count; i++) {
      await page.setContent(getHtml((i + 1) * 2), { waitUntil: "load" }); // データに変化を加えるためにパラメーターを渡してみている
      url.push(await page.$eval("#export", el => el.innerHTML));
    }

    await browser.close();
  })();
  // 測定終了
  performance.mark('api_end');
  performance.measure('api', 'api_start', 'api_end');
  console.log(performance.getEntriesByName('api'));
  console.log(`Api returnes ${url.length} images`);

  res.send(JSON.stringify({ "url": url }));
});
