import axios from "axios";

export const getClientSecretKey = (model) => {
  try {
    const URL = `http://localhost:8000/v1/agent/client_key?${model}`;
    return axios.get(URL).data;
  } catch (error) {
    console.error("Error fetching client secret key:", error);
    throw error;
  }
};
