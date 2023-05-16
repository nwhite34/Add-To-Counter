import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
  databaseURL: "https://playground-c91aa-default-rtdb.firebaseio.com/"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const shoppingListInDB = ref(database, "shoppingList");
const historyListInDB = ref(database, "historyList");

const inputFieldEl = document.getElementById("input-field");
const addButtonEl = document.getElementById("add-button");
const shoppingListEl = document.getElementById("shopping-list");
const historyDivEl = document.getElementById("HistoryDiv");
const deleteHistoryButtonEl = document.getElementById("delete-history-button");
const undoButtonEl = document.getElementById("undo-button");

let deletedHistoryItems = [];
const historyItemsKey = 'historyItems';

addButtonEl.addEventListener("click", function () {
  let inputValue = inputFieldEl.value;
  push(shoppingListInDB, inputValue);
  clearInputFieldEl();
});

onValue(shoppingListInDB, function (snapshot) {
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val());
    clearShoppingListEl();

    for (let i = 0; i < itemsArray.length; i++) {
      let currentItem = itemsArray[i];
      let currentItemID = currentItem[0];
      let currentItemValue = currentItem[1];
      appendItemToShoppingListEl(currentItemID, currentItemValue);
    }
  } else {
    shoppingListEl.innerHTML = "No items here... yet";
  }
});

function clearShoppingListEl() {
  shoppingListEl.innerHTML = "";
}

function clearInputFieldEl() {
  inputFieldEl.value = "";
}

function appendItemToShoppingListEl(itemID, itemValue) {
  let newEl = document.createElement("li");

  newEl.textContent = itemValue;

  newEl.addEventListener("click", function () {
    let exactLocationOfItemInDB = ref(database, `shoppingList/${itemID}`);

    // Remove the item from the shopping list
    remove(exactLocationOfItemInDB);

    // Add the item value and ID to the history list
    push(historyListInDB, { value: itemValue, id: itemID });
  });

  shoppingListEl.append(newEl);
}

onValue(historyListInDB, function (snapshot) {
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val());
    clearHistoryList();

    for (let i = 0; i < itemsArray.length; i++) {
      let currentItem = itemsArray[i];
      let currentItemID = currentItem[0];
      let currentItemValue = currentItem[1].value;
      appendItemToHistoryDiv(currentItemID, currentItemValue);
    }
  }
});

function clearHistoryList() {
  historyDivEl.innerHTML = '';
}

function appendItemToHistoryDiv(itemID, itemValue) {
  let newHistoryItem = document.createElement('p');
  newHistoryItem.textContent = `${itemValue} - ${getCurrentDate()}`;
  newHistoryItem.dataset.itemId = itemID; // Set the item's ID as a custom data attribute
  historyDivEl.append(newHistoryItem);
  saveHistoryItem(itemValue, itemID); // Save the item to local storage
}

function getCurrentDate() {
  const
currentDate = new Date();
const options = { year: 'numeric', month: 'long', day: 'numeric' };
return currentDate.toLocaleDateString(undefined, options);
}

function saveHistoryItem(itemValue, itemID) {
let historyItems = getSavedHistoryItems();
historyItems.push({ value: itemValue, id: itemID }); // Save the item with its ID
localStorage.setItem(historyItemsKey, JSON.stringify(historyItems));
}

function getSavedHistoryItems() {
let savedItems = localStorage.getItem(historyItemsKey);
return savedItems ? JSON.parse(savedItems) : [];
}

function loadHistoryItemsFromStorage() {
let historyItems = getSavedHistoryItems();
historyDivEl.innerHTML = ''; // Clear the

const addedItems = new Set(); // Create a Set to keep track of added items

for (let i = 0; i < historyItems.length; i++) {
let currentItem = historyItems[i];
let currentItemValue = currentItem.value;
let currentItemID = currentItem.id;

if (!addedItems.has(currentItemValue)) {
  appendItemToHistoryDiv(currentItemID, currentItemValue); // Pass the item's ID
  addedItems.add(currentItemValue); // Add the item to the Set
}
}
}

loadHistoryItemsFromStorage(); // Call this function on page load

deleteHistoryButtonEl.addEventListener("click", function () {
if (confirm("Are you sure, you wont get this information back?")) {
// Save it!
clearHistoryList();
remove(historyListInDB);
} else {
// Do nothing!
console.log('Thing was not saved to the database.');
}
});

undoButtonEl.addEventListener("click", function () {
deletedHistoryItems.forEach((item) => {
appendItemToHistoryDiv(item.id, item.value);
});
deletedHistoryItems = [];
});