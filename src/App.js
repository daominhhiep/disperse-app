import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import Web3 from 'web3';
import DisperseContract from './abi/Disperse.json';
import TokenABI from './abi/Token.json';
import {MaxUint256} from "ethers";

const contractAddress = process.env.CONTRACT;

const App = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [recipients, setRecipients] = useState('');
  const [values, setValues] = useState('');
  const [connectedAccount, setConnectedAccount] = useState('');
  const [web3, setWeb3] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.enable();
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        setConnectedAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('An error occurred while connecting to your wallet.');
      }
    } else {
      alert('Non-Ethereum browser detected. You should consider installing MetaMask.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!web3) {
      alert('Please connect your wallet first.');
      return;
    }

    // Create the contract instance
    const contract = new web3.eth.Contract(DisperseContract.abi, contractAddress);

    // Convert string addresses to array
    const recipientsArray = recipients.split(',').map(address => address.trim());

    // Convert string values to array of big numbers
    const valuesArray = values.split(',').map(value => web3.utils.toWei(value.trim(), 'ether'));

    try {
      // Get token instance
      const tokenInstance = new web3.eth.Contract(TokenABI.abi, tokenAddress);

      // Approve spending tokens by the contract
      await tokenInstance.methods.approve(contractAddress, MaxUint256).send({ from: connectedAccount });

      // Call the disperseToken function on the contract
      const accounts = await web3.eth.getAccounts();
      await contract.methods.disperseToken(tokenAddress, recipientsArray, valuesArray).send({ from: accounts[0] });
      alert('Tokens dispersed successfully!');
    } catch (error) {
      console.error('Error dispersing tokens:', error);
      alert('An error occurred while dispersing tokens.');
    }
  };


  return (
    <div>
      <h2>Disperse Tokens</h2>
      {connectedAccount ?
        <p>Connected Wallet: {connectedAccount}</p> :
        <Button variant="primary" onClick={connectWallet}>Connect Wallet</Button>
      }
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="tokenAddress">
          <Form.Label>Token Address</Form.Label>
          <Form.Control type="text" placeholder="Enter token address" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
        </Form.Group>
        <Form.Group controlId="recipients">
          <Form.Label>Recipients</Form.Label>
          <Form.Control type="text" placeholder="Enter recipient addresses (comma-separated)" value={recipients} onChange={(e) => setRecipients(e.target.value)} />
        </Form.Group>
        <Form.Group controlId="values">
          <Form.Label>Values</Form.Label>
          <Form.Control type="text" placeholder="Enter token values (comma-separated)" value={values} onChange={(e) => setValues(e.target.value)} />
        </Form.Group>
        <Button variant="primary" type="submit">Disperse Tokens</Button>
      </Form>
    </div>
  );
};

export default App;
