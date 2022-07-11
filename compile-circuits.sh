#!/bin/bash

#export NODE_OPTIONS="--max-old-space-size=16384"

cd circuits
mkdir -p build

if [ -f ./powersOfTau28_hez_final_17.ptau ]; then
    echo "powersOfTau28_hez_final_16.ptau already exists. Skipping."
else
    echo 'Creating powersOfTau28_hez_final_17.ptau'
    snarkjs powersoftau new bn128 17 pot17_0000.ptau -v
    snarkjs powersoftau contribute pot17_0000.ptau pot17_0001.ptau --name="First contribution" -v
    snarkjs powersoftau contribute pot17_0001.ptau powersOfTau28_hez_final_17.ptau --name="Second contribution" -v -e="some random text"
    snarkjs powersoftau verify powersOfTau28_hez_final_17.ptau
fi


echo "Compiling: sudoku..."

mkdir -p build/sudoku

# compile circuit

if [ -f ./build/sudoku.r1cs ]; then
    echo "Circuit already compiled. Skipping."
else
    circom sudoku.circom --r1cs --wasm --sym -o build
    snarkjs r1cs info build/sudoku.r1cs
fi

# Start a new zkey and make a contribution

if [ -f ./build/sudoku/verification_key.json ]; then
    echo "verification_key.json already exists. Skipping."
else
    snarkjs plonk setup build/sudoku.r1cs powersOfTau28_hez_final_17.ptau build/sudoku/circuit_final.zkey #circuit_0000.zkey
    #snarkjs zkey contribute build/sudoku/circuit_0000.zkey build/sudoku/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
    snarkjs zkey export verificationkey build/sudoku/circuit_final.zkey build/sudoku/verification_key.json
fi

# generate solidity contract
snarkjs zkey export solidityverifier build/sudoku/circuit_final.zkey ../contracts/verifier.sol