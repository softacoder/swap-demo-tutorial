let currentTrade = {};
let currentSelectSide;

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

// start 50 minutes .

init();

document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
  openModal("from");
};
document.getElementById("modal_close").onclick = closeModal();
document.getElementById("from_amount").onblur = getPrice(); 