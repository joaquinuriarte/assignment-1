const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16, plonk } = require("snarkjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

describe("HelloWorld", function () {
    this.timeout(100000000);
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply two numbers correctly", async function () {
        const circuit = await wasm_tester("contracts/circuits/HelloWorld.circom");

        const INPUT = {
            "a": 2,
            "b": 3
        }

        const witness = await circuit.calculateWitness(INPUT, true);

        // console.log(witness);

        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(6)));
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        
        // first generates the witness with input {"a":"2","b":"3"} and .wasm file as parameters and then uses the output (witness) and verification key (.zkey) as parameters to generate the proof.
        // it is also saving the public signals of the witness in "publicSignals" array.
        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");
        
        // prints the constant string "2x3 =" which corresponds to the private input signals used in the previous line and the first element of the publicSignal array which is the output signal of the circuit. 
        console.log('2x3 =',publicSignals[0]);
        
        // exports the proof and public signals in bytes format in order for smart contract to understand it. Saves output in calldata variable.
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
    
        // rearranges calldata in multiple ways and stores output in argv variable. First, using regex it eliminates all '"', '[', ']', ' '. Then, for all of the seperate numbers in calldata, it substitutes them for a string that represents the bigint of each of them. 
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        // the next four lines store each separate component of argv into independent variables
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
    
        // calls the verifyProof function in already deployed smart contract with the calldata in its appropiate format and checks if it returns true
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {

    beforeEach(async function () {
        //[assignment] insert your script here

        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Circuit should multiply three numbers correctly", async function () {
        //[assignment] insert your script here
        
        const circuit = await wasm_tester("contracts/circuits/Multiplier3.circom");
        
        const INPUT = {
            "a": 2,
            "b": 3,
            "c": 4
        }
        
        const witness = await circuit.calculateWitness(INPUT, true);
       
        //console.log(witness);
        
        assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
        assert(Fr.eq(Fr.e(witness[1]),Fr.e(24)));
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here

        const { proof, publicSignals } = await groth16.fullProve({"a":"2","b":"3","c":"4"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");
        
        console.log('2x3x4 =',publicSignals[0]);
        
        const calldata = await groth16.exportSolidityCallData(proof, publicSignals);
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
    
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });

    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here

        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {

    beforeEach(async function () {
        //[assignment] insert your script here

        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({"a":"2","b":"3","c":"4"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_0000.zkey");
        
        console.log('2x3x4 =',publicSignals[0]);

        const calldata = await plonk.exportSolidityCallData(proof, publicSignals);

        const a = calldata.split(",")[0];
        const b = JSON.parse(calldata.split(",")[1]);
        
        expect(await verifier.verifyProof(a, b)).to.be.true;
    });
    
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here

        let a = [0];
        let b = [0];
        expect(await verifier.verifyProof(a, b)).to.be.false;
    });
});