const express = require("express");
const app = express();

const utils = require("./utils");

app.get("/pokemon/:id", async (req, res) => {
  const id = req.params.id;
  const url = `https://pokeapi.co/api/v2/pokemon/${id}/`;
  let data = await utils.getData({ url });
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  data = utils.getImagesURL(data, id);

  res.send(data);
});

app.get("/", async (req, res) => {
  const limit = 151;
  const offset = 0;
  const url = `https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${limit}`;
  let data = await utils.getData({ url });
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  data = utils.getImagesURL(data.results);

  res.send(data);
});

app.listen(5000, () => {
  console.log("Listening on port 5000");
});
