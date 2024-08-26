import React, {useState} from 'react';
import {Form, Button} from 'react-bootstrap';
import {ethers} from 'ethers';
import DisperseContract from './abi/Disperse.json';

const App = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [recipients, setRecipients] = useState('');
  const [connectedAccount, setConnectedAccount] = useState('');
  const [ethSigner, setEthSigner] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({method: 'eth_requestAccounts'});
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        setEthSigner(signer);
        const accounts = await provider.send('eth_accounts');
        setConnectedAccount(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('An error occurred while connecting to your wallet.');
      }
    } else {
      alert('Non-Ethereum browser detected. You should consider installing MetaMask.');
    }
  };

  function getContract(address) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(address, DisperseContract.abi, signer);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const contractAddress = process.env.DISPERSE_CONTRACT;
    if (!ethSigner) {
      alert('Please connect your wallet first.');
      return;
    }
    console.log(contractAddress)
    // Create the contract instance
    const contract = getContract(contractAddress)


    // Convert CSV-like string to array of objects
    const parsedRecipients = recipients.trim().split('\n').map(line => {
      const [address, value] = line.split(',').map(item => item.trim());
      return {address, value: ethers.utils.parseEther(value)};
    });

    const recipientsArray = parsedRecipients.map(r => r.address);
    const valuesArray = parsedRecipients.map(r => r.value);

    try {
      // Call the disperseToken function on the contract
      // const accounts = await ethSigner.send('eth_accounts');
      const disperseToken = await contract.disperseToken(tokenAddress, recipientsArray, valuesArray);
      disperseToken.wait()
      console.log(disperseToken.hash);
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
          <Form.Control type="text" placeholder="Enter token address" value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}/>
        </Form.Group>
        <Form.Group controlId="recipients">
          <Form.Label>Recipients and Values (CSV format: address,value)</Form.Label>
          <Form.Control as="textarea" rows={5}
                        placeholder="Enter recipient addresses and values (CSV format: address,value)"
                        value={recipients} onChange={(e) => setRecipients(e.target.value)}/>
        </Form.Group>
        <Button variant="primary" type="submit">Disperse Tokens</Button>
      </Form>
    </div>
  );
};

export default App;
