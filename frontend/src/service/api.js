import axios from "axios";

export const getClientSecretKey = async (model) => {
  try {
    const URL = `${
      import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:8000"
    }/v1/agent/client_key?model=${model}`;

    return await axios.get(URL);
  } catch (error) {
    console.error("Error fetching client secret key:", error);
    throw error;
  }
};
