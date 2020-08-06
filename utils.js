const axios = require("axios");

async function getData(params) {
  const { url, header } = params;
  try {
    const response = await axios
      .get(url, header)
      .then((resp) => {
        return resp.data;
      })
      .catch((e) => {
        console.log(e);
      });
    return response;
  } catch (err) {
    console.log(err);
  }
}

function getImagesURL(data, id = null) {
  if (id !== null) {
    let url = `https://pokeres.bastionbot.org/images/pokemon/${id}.png`;
    data.image = url;
  } else {
    for (let i = 0; i < data.length; i++) {
      let url = `https://pokeres.bastionbot.org/images/pokemon/${i + 1}.png`;
      data[i].image = url;
      data[i].id = i;
    }
  }
  return data;
}

exports.getData = getData;
exports.getImagesURL = getImagesURL;
