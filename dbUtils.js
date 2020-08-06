const user = require("./user");
const { MongoClient } = require("mongodb");
const axios = require("axios");

const utils = require("./utils");

async function main() {
  const uri = `mongodb+srv://${user.username}:${user.password}@cluster0.5e9sr.mongodb.net/<dbname>?retryWrites=true&w=majority`;
  //Dispose of deprecation warnings
  const dispose = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  const client = new MongoClient(uri, dispose);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // List available Databases
    await listAndInitDatabases(client);
    await handleEvolutions(client);
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

main().catch(console.error);

async function listAndInitDatabases(client) {
  databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach((db) => console.log(` - ${db.name}`));

  let hasPokemons = false;
  databasesList.databases.forEach((db) => {
    db.name === "pokemons" ? (hasPokemons = true) : null;
  });
  if (!hasPokemons) {
    const pokemons = await utils.getData({
      url: "https://pokeapi.co/api/v2/pokemon/?offset=0&limit=151",
    });

    pokemons.results.forEach((p, index) => {
      p._id = index + 1;
    });

    await initPokemonsDatabase(client, pokemons.results);
  } else {
    return;
  }
}

async function initPokemonsDatabase(client, newPokemons) {
  const result = await client
    .db("pokemons")
    .collection("pokemonBasic")
    .insertMany(newPokemons);

  console.log(
    `${result.insertedCount} new pokemons(s) created with the following id(s):`
  );
  console.log(result.insertedIds);
}

async function handleEvolutions(client) {
  // The original pokemon evolution chains stop
  // at 78
  for (let evolutionChainId = 1; evolutionChainId < 79; evolutionChainId++) {
    try {
      const evolution = await utils.getData({
        url: `https://pokeapi.co/api/v2/evolution-chain/${evolutionChainId}/`,
      });

      let pokeEvolution = iterate(client, evolution.chain);
      console.log(pokeEvolution.evolvesTo[0].speciesURL);
    } catch (e) {
      console.error(e);
    }
  }
}

function iterate(client, evolutionsObj) {
  let name = evolutionsObj.species.name;
  let speciesURL = evolutionsObj.species.url;

  // We only want the original pokemons so the
  // next function discards any species after 151
  let discard = checkSpeciesId(speciesURL);
  if (discard) {
    return;
  }

  let evolvesTo = [];
  evolutionsObj.evolves_to.length
    ? evolutionsObj.evolves_to.forEach((e) => {
        evolvesTo.push(iterate(client, e));
      })
    : null;

  let returnedObj = { name, speciesURL, evolvesTo };
  addToDatabase(client, { name: returnedObj.name }, returnedObj);
  return returnedObj;
}

function checkSpeciesId(url) {
  let parts = url.split("/");
  let lastSegment = parts.pop() || parts.pop();

  return lastSegment > 151;
}

async function addToDatabase(client, pokeName, pokeEvolutionInfo) {
  result = await client
    .db("pokemons")
    .collection("pokemonBasic")
    .updateOne(pokeName, { $set: pokeEvolutionInfo });

  console.log(`${result.matchedCount} document(s) matched the query criteria.`);
  console.log(`${result.modifiedCount} document(s) was/were updated.`);
}
