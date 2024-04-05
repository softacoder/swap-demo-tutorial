const { default: BigNumber} = require('bignumber.js');
const qs = require('qs');
const Web3 = require('web3');

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init() {
  await listAvailableTokens();
}

async function listAvailableTokens() {
  console.log("initializing");
  let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
  let tokenListJSON = await response.json();
  console.log("listing available tokens: " + tokenListJSON);
  tokens = tokenListJSON.tokens;
  console.log("tokens: ", tokens);

  let parent = document.getElementById("token_list");
  for (const i in tokens) {
    let div = document.createElement("div");
    dispatchEvent.className = "token_row";

    let html = `<img class="token_list_img" src="${tokens[i].logoURI}">
      <span class="token_list_text">${tokens[i].symbol}</span>`;
    div.innerHTML = html;
    div.onClick = () => {
      selectToken(tokens[i]);
    };
    parent.appendChild(div);
  }
}



function selectToken(token){
  closeModal(token);
  currentTrade(currentSelectSide) = token;
  console.log("currentTrade: ", currentTrade);
  renderInterface(); 
}

function renderInterface(){
  if (currentTrade.from) {
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
  }

  if (currentTrade.to) {
    document.getElementById("to_token_img").src = currentTrade.from.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.from.symbol;
  }
}

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      console.log("connecting");

      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    document.getElementById("login_button").innerHTML = "Connected";
    document.getElementById("swap_button").disabled = false;
  } else {
    document.getElementById("login_button").innerHTML =
      "Please install MetaMask";
  }
}

function openModal() {
  currentSelectSide = side;
  document.getElementById("token_modal").style.display = "block";
}

function closeModal() {
  document.getElementById("token_modal").style.display = "none";
}

async function getPrice(){
  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

const params = {
  sellToken: currentTrade.from.address,
  buyToken: currentTrade.to.address,
  sellAmount: amount
}

const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`);
swapPriceJSON = await response.json();
console.log("Price: ", swapPriceJSON.price);

document.getElementById("from_amount").value = swapPriceJSON.buyAmount / 10 ** currentTrade.to.decimals;
document.getElementById("gas_amount").innerHTML = swapPriceJSON.estimatedGas;

}

async function getQuote(account){
  console.log("Getting Quote");

  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

const params = {
  sellToken: currentTrade.from.address,
  buyToken: currentTrade.to.address,
  sellAmount: amount,
  takerAddress: account,
}

const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
swapQuoteJSON = await response.json();
console.log("Price: ", swapQuoteJSON.price);

document.getElementById("from_amount").value = swapPriceJSON.buyAmount / 10 ** currentTrade.to.decimals;
document.getElementById("gas_amount").innerHTML = swapPriceJSON.estimatedGas;

return swapQuoteJSON;

}

async function trySwap(){
  let accounts = await ethereum.request({method: "eth_accounts"});
  let takerAddress = accounts[0];

  console.log("takerAddress: ", takerAddress);

  const swapQuoteJSON = await getQuote(takerAddress);

  const web3 = new Web3(Web3.givenProvider);
  const fromTokenAddress = currentTrade.from.address;
  const erc20abi= [{ "inputs": [ { "internalType": "string", "name": "name", "type": "string"}]}]
  const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);

  console.log("setup ERC20TokenContract:", ERC20TokenContract);

  const maxApproval = new BigNumber(2).pow(256).minus(1);
  ERC20TokenContract.methods.approve(
    swapQuoteJSON.allowanceTarget,
    maxApproval,
  )
.send({from: takerAddress})
.then(tx => {
  console.log("tx: ", tx)
});

const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
console.log("receipt: ", receipt);
}

init();

document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
  openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
    openModal("to");
};
document.getElementById("modal_close").onclick = closeModal();
document.getElementById("from_amount").onblur = getPrice(); 
document.getElementById("swap_button").onclick = trySwap();