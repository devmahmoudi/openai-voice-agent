export const initialState = {
  isRecording: false,
  socketStatus: "disconnected",
};

export function reducer(state, action) {
  switch (action.type) {
    case "START_RECORDING":
      return { ...state, isRecording: true };
    case "STOP_RECORDING":
      return { ...state, isRecording: false };
    case "SET_SOCKET_STATUS":
      return { ...state, socketStatus: action.payload };
    default:
      return state;
  }
}
