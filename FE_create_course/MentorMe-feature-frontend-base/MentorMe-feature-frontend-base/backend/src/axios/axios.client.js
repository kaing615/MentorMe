import axios from "axios";

const get = async (url) => {
  const response = await axios.get(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "identity",
    },
  });
  return response.data;
};

const post = async (url, data) => {
  const response = await axios.post(url, data, {
    headers: { Accept: "application/json" },
  });
  return response.data;
};

export default { get, post };
