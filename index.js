const brain = require('brainjs');

const network = new brain.NeuralNetwork();

network.train([
    { input: [1,0,0], output: [0] },
    { input: [10,10,10], output: [1] },
    { input: [21,21,11], output: [2] },
    { input: [30,31,30], output: [3] },
])

const output = network.run([40,40,40]);
console.log(output);
