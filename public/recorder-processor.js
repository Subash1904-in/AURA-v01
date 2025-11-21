class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs /*, outputs, parameters */) {
    const input = inputs[0];
    if (input && input[0] && input[0].length > 0) {
      // Send a copy of the Float32Array to the main thread
      const channelData = input[0].slice(0);
      this.port.postMessage(channelData);
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
